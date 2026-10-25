const mongoose = require("mongoose");

const leaseSchema = new mongoose.Schema({
  unitId: { type: String, required: true },
  tenantId: { type: String, required: true },
  start: { type: String, required: true },
  end: { type: String, required: true },
  rent: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ["Draft", "Active", "Expired"], default: "Draft" },
});

leaseSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

module.exports = mongoose.model("Lease", leaseSchema);