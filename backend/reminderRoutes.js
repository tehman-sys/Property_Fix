const express = require("express");
const Reminder = require("./models/Reminder");
const User = require("./models/User");
const { runReminderAgent } = require("./agent");
const { friendly } = require("./ai");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const reminders = await Reminder.find({ ownerId: req.userId }).sort({ _id: -1 }).limit(100);
    res.json({ reminders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/run", async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const result = await runReminderAgent({ ownerId: req.userId, landlordName: user?.name });
    res.json(result);
  } catch (err) {
    console.error("Agent error:", err.message);
    const e = friendly(err);
    res.status(e.status).json({ error: e.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Draft", "Approved", "Dismissed"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    const reminder = await Reminder.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.userId },
      { status },
      { new: true }
    );
    if (!reminder) return res.status(404).json({ error: "Reminder not found" });
    res.json(reminder);
  } catch {
    res.status(400).json({ error: "Invalid id" });
  }
});

module.exports = router;