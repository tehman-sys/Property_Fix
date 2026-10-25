const mongoose = require("mongoose");
const Lease = require("./models/Lease");

const leases = [
  { unitId: "u1", tenantId: "6ade4c4311eae1df3e04bbbe", start: "2026-01-01", end: "2026-12-31", rent: 65000, status: "Active" },
  { unitId: "u2", tenantId: "6ade4c4311eae1df3e04bbbf", start: "2026-01-01", end: "2026-12-31", rent: 55000, status: "Active" },
  { unitId: "u4", tenantId: "6ade4c4411eae1df3e04bbc1", start: "2026-03-01", end: "2027-02-28", rent: 120000, status: "Active" },
  { unitId: "u5", tenantId: "6ade4c4411eae1df3e04bbc2", start: "2026-03-01", end: "2027-02-28", rent: 125000, status: "Active" },
  { unitId: "u6", tenantId: "6ade4c4311eae1df3e04bbc0", start: "2026-11-01", end: "2027-10-31", rent: 80000, status: "Draft" },
];

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  await Lease.deleteMany({});
  await Lease.insertMany(leases);
  console.log("Seeded", leases.length, "leases");
  await mongoose.disconnect();
})();