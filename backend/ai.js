const OpenAI = require("openai");

const MODEL = process.env.OPENAI_MODEL || "gpt-5-mini";
const TIMEOUT_MS = 25000;
const MAX_OUTPUT_TOKENS = 2000;
const RATE_LIMIT = 20; // calls per user
const RATE_WINDOW_MS = 10 * 60 * 1000;

class AiError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}

let client = null;
function getClient() {
  if (!process.env.OPENAI_API_KEY) throw new AiError("AI is not configured on the server", 503);
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: TIMEOUT_MS, maxRetries: 0 });
  }
  return client;
}

// simple per-user limit (in memory, so it is approximate on serverless)
const calls = new Map();
function checkRate(userId) {
  const now = Date.now();
  const recent = (calls.get(userId) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    throw new AiError("Too many AI requests. Please wait a few minutes.", 429);
  }
  recent.push(now);
  calls.set(userId, recent);
}

// second safety net: does the answer match the schema we asked for?
function matches(schema, v) {
  if (schema.enum && !schema.enum.includes(v)) return false;
  switch (schema.type) {
    case "string": return typeof v === "string";
    case "boolean": return typeof v === "boolean";
    case "array": return Array.isArray(v) && v.every((x) => matches(schema.items, x));
    case "object":
      return (
        !!v && typeof v === "object" &&
        (schema.required || []).every((k) => k in v && matches(schema.properties[k], v[k]))
      );
    default: return true;
  }
}

function friendly(err) {
  if (err instanceof AiError) return err;
  if (err.status === 401) return new AiError("The AI key is invalid. Tell the admin.", 503);
  if (err.status === 429) return new AiError("AI quota or rate limit reached. Try again later.", 503);
  if (err.name && err.name.includes("Timeout")) return new AiError("The AI took too long. Try again.", 504);
  return new AiError("The AI request failed. Try again.", 502);
}

async function callJSON({ feature, userId, system, user, name, schema }) {
  checkRate(userId);
  const started = Date.now();
  let tokens = 0;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await getClient().chat.completions.create({
        model: MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_schema", json_schema: { name, strict: true, schema } },
        max_completion_tokens: MAX_OUTPUT_TOKENS,
        ...(MODEL.startsWith("gpt-5") ? { reasoning_effort: "minimal" } : {}),
      });
      tokens += res.usage?.total_tokens || 0;
      const msg = res.choices[0].message;
      if (msg.refusal) throw new AiError("The AI declined this request", 422);
      const data = JSON.parse(msg.content || "");
      if (!matches(schema, data)) throw new SyntaxError("bad shape");
      console.log(JSON.stringify({ ai: feature, user: userId, ms: Date.now() - started, tokens, ok: true }));
      return data;
    } catch (err) {
      const retryable = err instanceof SyntaxError && attempt === 1; // bad JSON: try once more
      if (retryable) continue;
      console.log(JSON.stringify({ ai: feature, user: userId, ms: Date.now() - started, tokens, ok: false, error: err.message }));
      throw err instanceof SyntaxError ? new AiError("The AI gave an unusable answer. Try again.", 502) : friendly(err);
    }
  }
}

module.exports = { callJSON, AiError };