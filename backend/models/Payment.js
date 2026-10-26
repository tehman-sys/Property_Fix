const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  leaseId: { type: String, required: true },
  amount: { type: Number, required: true, min: 1 },
  month: { type: String, required: true }, // e.g. "2026-10"
  paidOn: { type: Date, default: Date.now },
});

paymentSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

module.exports = mongoose.model("Payment", paymentSchema);