require("dotenv").config();
const mongoose = require("mongoose");
const Property = require("./models/Property");
const Unit = require("./models/Unit");
const Lease = require("./models/Lease");
const Repair = require("./models/Repair");
const Payment = require("./models/Payment");

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const propertyIds = new Set((await Property.find()).map((p) => String(p._id)));
  const units = await Unit.find();
  const orphans = units.filter((u) => !propertyIds.has(u.propertyId));
  const orphanIds = orphans.map((u) => String(u._id));

  const leases = await Lease.find({ unitId: { $in: orphanIds } });
  const leaseIds = leases.map((l) => String(l._id));

  console.log("Orphan units:", orphans.map((u) => u.name));
  await Payment.deleteMany({ leaseId: { $in: leaseIds } });
  await Lease.deleteMany({ unitId: { $in: orphanIds } });
  await Repair.deleteMany({ unitId: { $in: orphanIds } });
  await Unit.deleteMany({ _id: { $in: orphanIds } });
  console.log("Cleaned:", orphans.length, "units,", leases.length, "leases");

  await mongoose.disconnect();
})();