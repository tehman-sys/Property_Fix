require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Property = require("./models/Property");
const Unit = require("./models/Unit");
const Tenant = require("./models/Tenant");
const Lease = require("./models/Lease");
const Repair = require("./models/Repair");
const Payment = require("./models/Payment");

(async () => {
  const email = (process.argv[2] || "").toLowerCase();
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOne({ email });
  if (!user) {
    console.log("No user with that email. Sign up in the app first.");
    process.exit(1);
  }
  for (const [name, Model] of Object.entries({ Property, Unit, Tenant, Lease, Repair, Payment })) {
    const r = await Model.updateMany({ ownerId: { $exists: false } }, { ownerId: String(user._id) });
    console.log(name, "updated:", r.modifiedCount);
  }
  await mongoose.disconnect();
})();