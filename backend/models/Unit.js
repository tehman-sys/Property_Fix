const mongoose = require("mongoose");

const unitSchema = new mongoose.Schema({
    ownerId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    propertyId: { type: String, required: true },

});

unitSchema.set("toJSON", {
    transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
    },
});

module.exports = mongoose.model("Unit", unitSchema);