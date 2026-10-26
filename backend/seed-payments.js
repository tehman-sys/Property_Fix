const mongoose = require("mongoose");
const Lease = require("./models/Lease");
const Payment = require("./models/Payment");

const month = new Date().toISOString().slice(0, 7);
const paidByUnit = { u1: 65000, u2: 20000, u5: 125000 };

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  await Payment.deleteMany({});
  for (const [unitId, amount] of Object.entries(paidByUnit)) {
    const lease = await Lease.findOne({ unitId, status: "Active" });
    if (lease) await Payment.create({ leaseId: lease._id.toString(), amount, month });
  }
  console.log("Seeded payments for", month);
  await mongoose.disconnect();
})();