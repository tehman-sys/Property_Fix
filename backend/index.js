const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 4000;
const mongoose = require("mongoose");
const Property = require("./models/Property");
const Tenant = require("./models/Tenant");  
const Lease = require("./models/Lease");
const Repair = require("./models/Repair");
const Payment = require("./models/Payment");

app.use(cors());
app.use(express.json());

let connecting = null;

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  if (!connecting) {
    connecting = mongoose.connect(process.env.MONGODB_URI).then(() => {
      console.log("Mongo connected");
    });
  }
  try {
    await connecting;
  } catch (err) {
    connecting = null;
    throw err;
  }
}

// connect to the database before every request
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("Mongo connection failed:", err.message);
    res.status(500).json({ error: "Database connection failed" });
  }
});

app.get("/api/properties", async (req, res) => {
  try {
    const properties = await Property.find().sort({ _id: 1 });
    res.json({ properties });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/properties/:id", async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ error: "Property not found" });
    res.json(property);
  } catch (err) {
    res.status(400).json({ error: "Invalid id" });
  }
});

app.post("/api/properties", async (req, res) => {
  try {
    const { name, address, type } = req.body;
    const property = await Property.create({ name, address, type });
    res.status(201).json(property);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch("/api/properties/:id", async (req, res) => {
  try {
    const update = {};
    for (const k of ["name", "address", "type"]) {
      if (req.body[k] !== undefined) update[k] = req.body[k];
    }
    const property = await Property.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!property) return res.status(404).json({ error: "Property not found" });
    res.json(property);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/properties/:id", async (req, res) => {
  try {
    const property = await Property.findByIdAndDelete(req.params.id);
    if (!property) return res.status(404).json({ error: "Property not found" });
    res.json({ message: "Property deleted" });
  } catch (err) {
    res.status(400).json({ error: "Invalid id" });
  }
}); 

app.get("/api/tenants", async (req, res) => {
  try {
    const tenants = await Tenant.find().sort({ _id: 1 });
    res.json({ tenants });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/tenants", async (req, res) => {
  try {
    const { name, phone, email } = req.body;
    const tenant = await Tenant.create({ name, phone, email });
    res.status(201).json(tenant);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch("/api/tenants/:id", async (req, res) => {
  try {
    const update = {};
    for (const k of ["name", "phone", "email"]) {
      if (req.body[k] !== undefined) update[k] = req.body[k];
    }
    const tenant = await Tenant.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });
    res.json(tenant);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/tenants/:id", async (req, res) => {
  try {
    const tenant = await Tenant.findByIdAndDelete(req.params.id);
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });
    res.json({ message: "Tenant deleted" });
  } catch (err) {
    res.status(400).json({ error: "Invalid id" });
  }
});

app.get("/api/leases", async (req, res) => {
  try {
    const leases = await Lease.find().sort({ _id: 1 });
    res.json({ leases });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/leases", async (req, res) => {
  try {
    const { unitId, tenantId, start, end, rent } = req.body;
    if (start && end && end <= start) {
      return res.status(400).json({ error: "End date must be after start date" });
    }
    const lease = await Lease.create({ unitId, tenantId, start, end, rent, status: "Draft" });
    res.status(201).json(lease);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Draft -> Active (a unit can only have one active lease)
app.post("/api/leases/:id/sign", async (req, res) => {
  try {
    const lease = await Lease.findById(req.params.id);
    if (!lease) return res.status(404).json({ error: "Lease not found" });
    const clash = await Lease.findOne({
      unitId: lease.unitId,
      status: "Active",
      _id: { $ne: lease._id },
    });
    if (clash) return res.status(409).json({ error: "This unit already has an active lease" });
    lease.status = "Active";
    await lease.save();
    res.json(lease);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/leases/:id", async (req, res) => {
  try {
    const lease = await Lease.findByIdAndDelete(req.params.id);
    if (!lease) return res.status(404).json({ error: "Lease not found" });
    res.json({ message: "Lease deleted" });
  } catch (err) {
    res.status(400).json({ error: "Invalid id" });
  }
});

app.get("/api/repairs", async (req, res) => {
  try {
    const repairs = await Repair.find().sort({ _id: 1 });
    res.json({ repairs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/repairs", async (req, res) => {
  try {
    const { unitId, title, priority } = req.body;
    const repair = await Repair.create({ unitId, title, priority, status: "Open" });
    res.status(201).json(repair);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// change the status of a repair
app.patch("/api/repairs/:id", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Open", "In progress", "Done"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    const repair = await Repair.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!repair) return res.status(404).json({ error: "Repair not found" });
    res.json(repair);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/repairs/:id", async (req, res) => {
  try {
    const repair = await Repair.findByIdAndDelete(req.params.id);
    if (!repair) return res.status(404).json({ error: "Repair not found" });
    res.json({ message: "Repair deleted" });
  } catch (err) {
    res.status(400).json({ error: "Invalid id" });
  }
});

const currentMonth = () => new Date().toISOString().slice(0, 7);

app.get("/api/payments", async (req, res) => {
  try {
    const month = req.query.month || currentMonth();
    const payments = await Payment.find({ month }).sort({ _id: 1 });
    res.json({ payments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/payments", async (req, res) => {
  try {
    const { leaseId, amount } = req.body;
    const value = Number(amount);
    if (!(value > 0)) return res.status(400).json({ error: "Amount must be more than 0" });

    const lease = await Lease.findById(leaseId);
    if (!lease) return res.status(404).json({ error: "Lease not found" });
    if (lease.status !== "Active") {
      return res.status(400).json({ error: "Only active leases can receive payments" });
    }

    const month = currentMonth();
    const earlier = await Payment.find({ leaseId, month });
    const paidSoFar = earlier.reduce((sum, p) => sum + p.amount, 0);
    if (paidSoFar + value > lease.rent) {
      return res
        .status(400)
        .json({ error: `Payment is more than the balance (Rs ${lease.rent - paidSoFar})` });
    }

    const payment = await Payment.create({ leaseId, amount: value, month });
    res.status(201).json(payment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/payments/:id", async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) return res.status(404).json({ error: "Payment not found" });
    res.json({ message: "Payment deleted" });
  } catch (err) {
    res.status(400).json({ error: "Invalid id" });
  }
});

// handle all other routes with a 404
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});



// run a normal server locally; on Vercel the app is exported instead
if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
}

module.exports = app;