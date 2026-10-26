const mongoose = require("mongoose");

const repairSchema = new mongoose.Schema({
  unitId: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
  status: { type: String, enum: ["Open", "In progress", "Done"], default: "Open" },
});

repairSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

module.exports = mongoose.model("Repair", repairSchema);