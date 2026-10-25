const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 4000;
const mongoose = require("mongoose");
const Property = require("./models/Property");
const Tenant = require("./models/Tenant");  
const Lease = require("./models/Lease");

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

// handle all other routes with a 404
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// run a normal server locally; on Vercel the app is exported instead
if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
}

module.exports = app;