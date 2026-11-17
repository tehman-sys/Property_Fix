const express = require("express");
const User = require("./models/User");
const { runReminderAgent } = require("./agent");

const router = express.Router();

const MAX_USERS = 25;       // cap per run
const BUDGET_MS = 50000;    // stop starting new users after this

const brief = (r) => ({ drafts: r.drafts, needsReview: r.needsReview, stopped: r.stopped });

router.get("/daily", async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) return res.status(503).json({ error: "CRON_SECRET is not set" }); // never run open
  if (req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const started = Date.now();
    const users = await User.find().sort({ _id: 1 }).limit(MAX_USERS).lean();
    const summary = [];

    for (const u of users) {
      if (Date.now() - started > BUDGET_MS) {
        summary.push({ stopped: "time_budget" });
        break;
      }
      const ownerId = String(u._id);
      const entry = { user: ownerId };
      try {
        entry.rent = brief(await runReminderAgent({ ownerId, landlordName: u.name }));
      } catch (err) {
        entry.rentError = err.message;
      }
      summary.push(entry);
    }

    console.log(JSON.stringify({ cron: "daily", users: users.length, ms: Date.now() - started }));
    res.json({ ok: true, summary });
  } catch (err) {
    console.error("Cron error:", err.message);
    res.status(500).json({ error: "Cron run failed" });
  }
});

module.exports = router;