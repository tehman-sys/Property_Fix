const mongoose = require("mongoose");

const CURRENCIES = ["PKR", "USD", "EUR", "GBP", "AED", "SAR", "INR"];

const settingsSchema = new mongoose.Schema({
  ownerId: { type: String, required: true, unique: true },
  ownerName: { type: String, trim: true, maxlength: 80, default: "" },
  currency: { type: String, enum: CURRENCIES, default: "PKR" },
});

settingsSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.ownerId;
  },
});

module.exports = mongoose.model("Settings", settingsSchema);
module.exports.CURRENCIES = CURRENCIES;