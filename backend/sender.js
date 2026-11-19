const Lease = require("./models/Lease");
const Tenant = require("./models/Tenant");
const Payment = require("./models/Payment");
const Reminder = require("./models/Reminder");
const { sendEmail, isLive } = require("./mailer");

const SEND_FROM_DAY = Number(process.env.SEND_FROM_DAY || 5); // send from the 5th onward (UTC date)
const MAX_PER_RUN = 25;                                        // cap per run
const STALE_MS = 10 * 60 * 1000;

const currentMonth = () => new Date().toISOString().slice(0, 7);
const today = () => new Date().toISOString().slice(0, 10);
const validEmail = (e) => /^\S+@\S+\.\S+$/.test(String(e || ""));

async function sendApprovedReminders({ ownerId, landlordEmail, force = false }) {
  const out = {
    sent: 0, skipped: 0, failed: 0, needsReview: 0,
    mode: isLive() ? "live" : "test", stopped: "finished", trace: [],
  };

  // the schedule rule: on the cron, nothing is sent before the 5th
  if (!force && new Date().getUTCDate() < SEND_FROM_DAY) {
    return { ...out, stopped: "before_send_day" };
  }

  // a send that died halfway may or may not have gone out, so a human has to check
  await Reminder.updateMany(
    { ownerId, status: "Sending", updatedAt: { $lt: new Date(Date.now() - STALE_MS) } },
    { status: "NeedsReview", note: "A send was interrupted. Check whether this email went out." }
  );

  const approved = await Reminder.find({ ownerId, status: "Approved" }).sort({ _id: 1 }).limit(MAX_PER_RUN).lean();
  if (approved.length === 0) return { ...out, stopped: "nothing_to_do" };

  const review = async (r, note) => {
    await Reminder.updateOne({ _id: r._id }, { status: "NeedsReview", note: `Held back: ${note}` });
    out.needsReview++;
    out.trace.push(`${r.tenantName}: held for review (${note})`);
  };

  for (const found of approved) {
    // claim it, so two runs can never send the same reminder twice
    const r = await Reminder.findOneAndUpdate(
      { _id: found._id, ownerId, status: "Approved" },
      { status: "Sending" },
      { new: true }
    );
    if (!r) continue;

    const lease = await Lease.findOne({ _id: r.leaseId, ownerId });
    if (!lease) { await review(r, "the lease no longer exists"); continue; }

    // guardrail: re-check the facts now, because the draft may be days old
    if (r.type === "Renewal") {
      if (lease.status !== "Active" || lease.end !== r.endDate) { await review(r, "the lease changed since the draft"); continue; }
      if (lease.end < today()) { await review(r, "the lease has already ended"); continue; }
    } else {
      if (r.month !== currentMonth()) { await review(r, `this draft is from ${r.month}`); continue; }
      if (lease.status !== "Active") { await review(r, "the lease is no longer active"); continue; }
      const payments = await Payment.find({ ownerId, leaseId: String(lease._id), month: r.month }).lean();
      const balance = lease.rent - payments.reduce((s, p) => s + p.amount, 0);
      if (balance <= 0) {
        await Reminder.updateOne({ _id: r._id }, { status: "Dismissed", note: "Not sent: the tenant has already paid." });
        out.skipped++;
        out.trace.push(`${r.tenantName}: skipped (already paid)`);
        continue;
      }
      if (balance !== r.amount) { await review(r, `the balance changed from ${r.amount} to ${balance}`); continue; }
    }

    // the address is looked up here, in plain code. The model never sees it.
    const tenant = await Tenant.findOne({ _id: lease.tenantId, ownerId });
    if (!tenant || !validEmail(tenant.email)) { await review(r, "the tenant has no valid email"); continue; }

    const subject = r.type === "Renewal"
      ? `Your lease at ${r.unitLabel} ends on ${r.endDate}`
      : `Rent reminder for ${r.unitLabel}`;
    const started = Date.now();
    try {
      const res = await sendEmail({
        to: tenant.email, subject, text: r.message, replyTo: landlordEmail, label: r.tenantName,
      });
      await Reminder.updateOne({ _id: r._id }, {
        status: "Sent", sentAt: new Date(), sentTo: res.sentTo,
        note: res.mode === "test" ? "TEST MODE: delivered to your own address, not the tenant." : "",
      });
      out.sent++;
      out.trace.push(`${r.tenantName}: sent (${res.mode} mode)`);
      console.log(JSON.stringify({ email: "sent", user: ownerId, type: r.type || "Rent", mode: res.mode, ms: Date.now() - started }));
    } catch (err) {
      await Reminder.updateOne({ _id: r._id }, { status: "Failed", note: String(err.message).slice(0, 200) });
      out.failed++;
      out.trace.push(`${r.tenantName}: failed (${err.message})`);
      console.log(JSON.stringify({ email: "failed", user: ownerId, error: err.message }));
    }
  }
  return out;
}

module.exports = { sendApprovedReminders };