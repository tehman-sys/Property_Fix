const nodemailer = require("nodemailer");

const isLive = () => process.env.EMAIL_MODE === "live";

let transporter = null;
function getTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_APP_PASSWORD;
  if (!user || !pass) throw new Error("Email is not configured (EMAIL_USER / EMAIL_APP_PASSWORD)");
  if (!transporter) {
    transporter = nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
  }
  return transporter;
}

// In test mode every message goes to EMAIL_TEST_TO, never to the tenant.
async function sendEmail({ to, subject, text, replyTo, label }) {
  let realTo = to;
  let realSubject = subject;
  if (!isLive()) {
    const testTo = process.env.EMAIL_TEST_TO;
    if (!testTo) throw new Error("EMAIL_TEST_TO is not set (test mode needs your own address)");
    realTo = testTo;
    realSubject = `[TEST for ${label}] ${subject}`;
  }
  await getTransporter().sendMail({
    from: `"${process.env.EMAIL_FROM_NAME || "PropertyFix"}" <${process.env.EMAIL_USER}>`,
    to: realTo,
    subject: realSubject,
    text,
    ...(replyTo ? { replyTo } : {}),
  });
  return { sentTo: realTo, mode: isLive() ? "live" : "test" };
}

module.exports = { sendEmail, isLive };