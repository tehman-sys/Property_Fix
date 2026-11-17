const mongoose = require("mongoose");

const reminderSchema = new mongoose.Schema(
  {
    ownerId: { type: String, required: true, index: true },
    leaseId: { type: String, required: true },
    month: { type: String, required: true },
    tenantName: { type: String, required: true },
    unitLabel: { type: String, required: true },
    amount: { type: Number, required: true },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ["Draft", "Approved", "Dismissed", "NeedsReview"],
      default: "Draft",
    },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

reminderSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

module.exports = mongoose.model("Reminder", reminderSchema);