const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  type: { type: String, required: true, trim: true },
});

// send "id" to the front end instead of "_id"
propertySchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

module.exports = mongoose.model("Property", propertySchema);