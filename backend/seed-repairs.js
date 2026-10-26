const mongoose = require("mongoose");
const Repair = require("./models/Repair");

const repairs = [
  { unitId: "u2", title: "Kitchen tap leaking", priority: "Medium", status: "Open" },
  { unitId: "u4", title: "AC not cooling", priority: "High", status: "In progress" },
  { unitId: "u1", title: "Hallway light replaced", priority: "Low", status: "Done" },
];

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  await Repair.deleteMany({});
  await Repair.insertMany(repairs);
  console.log("Seeded", repairs.length, "repairs");
  await mongoose.disconnect();
})();