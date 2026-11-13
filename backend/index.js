require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Property = require("./models/Property");
const Unit = require("./models/Unit");
const Tenant = require("./models/Tenant");
const Lease = require("./models/Lease");
const Repair = require("./models/Repair");
const Payment = require("./models/Payment");
const settingsRouter = require("./routes/settings");
const User = require("./models/User");
const aiRouter = require("./aiRoutes");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const currentMonth = () => new Date().toISOString().slice(0, 7);
const today = () => new Date().toISOString().slice(0, 10);

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

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("Mongo connection failed:", err.message);
    res.status(500).json({ error: "Database connection failed" });
  }
});

/* ---------- Auth (public routes) ---------- */
const signToken = (user) =>
  jwt.sign({ uid: String(user._id) }, process.env.JWT_SECRET, { expiresIn: "7d" });

app.post("/api/auth/signup", async (req, res) => {
  try {
    const name = String(req.body.name ?? "").trim();
    const email = String(req.body.email ?? "").trim().toLowerCase();
    const password = String(req.body.password ?? "");
    if (!name) return res.status(400).json({ error: "Name is required" });
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: "Enter a valid email" });
    if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
    if (await User.findOne({ email })) return res.status(409).json({ error: "An account with this email already exists" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });
    res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const email = String(req.body.email ?? "").trim().toLowerCase();
    const password = String(req.body.password ?? "");
    const user = await User.findOne({ email });
    const ok = user && (await bcrypt.compare(password, user.passwordHash));
    if (!ok) return res.status(401).json({ error: "Wrong email or password" });
    res.json({ token: signToken(user), user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* ---------- Everything below needs a logged-in user ---------- */
function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Please log in" });
  try {
    req.userId = jwt.verify(token, process.env.JWT_SECRET).uid;
    next();
  } catch {
    res.status(401).json({ error: "Session expired. Please log in again." });
  }
}
app.use("/api", auth);

app.get("/api/auth/me", async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(401).json({ error: "Please log in" });
    res.json({ user });
  } catch (err) {
    res.status(401).json({ error: "Please log in" });
  }
});

/* ---------- Properties ---------- */
app.get("/api/properties", async (req, res) => {
  try {
    const properties = await Property.find({ ownerId: req.userId }).sort({ _id: 1 });
    res.json({ properties });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/properties/:id", async (req, res) => {
  try {
    const property = await Property.findOne({ _id: req.params.id, ownerId: req.userId });
    if (!property) return res.status(404).json({ error: "Property not found" });
    res.json(property);
  } catch (err) {
    res.status(400).json({ error: "Invalid id" });
  }
});

app.post("/api/properties", async (req, res) => {
  try {
    const { name, address, type } = req.body;
    const property = await Property.create({ name, address, type, ownerId: req.userId });
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
    const property = await Property.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.userId },
      update,
      { new: true, runValidators: true }
    );
    if (!property) return res.status(404).json({ error: "Property not found" });
    res.json(property);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/properties/:id", async (req, res) => {
  try {
    const ownerId = req.userId;
    const units = await Unit.find({ propertyId: req.params.id, ownerId });
    const unitIds = units.map((u) => String(u._id));

    const active = await Lease.findOne({ unitId: { $in: unitIds }, status: "Active", ownerId });
    if (active) {
      return res
        .status(409)
        .json({ error: "A unit in this property has an active lease. Delete that lease first." });
    }

    const property = await Property.findOneAndDelete({ _id: req.params.id, ownerId });
    if (!property) return res.status(404).json({ error: "Property not found" });

    const leases = await Lease.find({ unitId: { $in: unitIds }, ownerId });
    const leaseIds = leases.map((l) => String(l._id));
    await Payment.deleteMany({ leaseId: { $in: leaseIds }, ownerId });
    await Lease.deleteMany({ unitId: { $in: unitIds }, ownerId });
    await Repair.deleteMany({ unitId: { $in: unitIds }, ownerId });
    await Unit.deleteMany({ propertyId: req.params.id, ownerId });

    res.json({ message: "Property deleted" });
  } catch (err) {
    res.status(400).json({ error: "Invalid id" });
  }
});

/* ---------- Units ---------- */
app.get("/api/units", async (req, res) => {
  try {
    const units = await Unit.find({ ownerId: req.userId }).sort({ _id: 1 });
    res.json({ units });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/units", async (req, res) => {
  try {
    const { propertyId } = req.body;
    const name = String(req.body.name ?? "").trim();
    const property = await Property.findOne({ _id: propertyId, ownerId: req.userId });
    if (!property) return res.status(404).json({ error: "Property not found" });
    const dup = await Unit.findOne({ propertyId, name, ownerId: req.userId });
    if (dup) return res.status(409).json({ error: "This property already has a unit with that name" });
    const unit = await Unit.create({ propertyId, name, ownerId: req.userId });
    res.status(201).json(unit);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* ---------- Tenants ---------- */
app.get("/api/tenants", async (req, res) => {
  try {
    const tenants = await Tenant.find({ ownerId: req.userId }).sort({ _id: 1 });
    res.json({ tenants });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/tenants", async (req, res) => {
  try {
    const { name, phone, email } = req.body;
    const tenant = await Tenant.create({ name, phone, email, ownerId: req.userId });
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
    const tenant = await Tenant.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.userId },
      update,
      { new: true, runValidators: true }
    );
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });
    res.json(tenant);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/tenants/:id", async (req, res) => {
  try {
    const anyLease = await Lease.findOne({ tenantId: req.params.id, ownerId: req.userId });
    if (anyLease) {
      return res.status(409).json({ error: "This tenant has leases. Delete those leases first." });
    }
    const tenant = await Tenant.findOneAndDelete({ _id: req.params.id, ownerId: req.userId });
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });
    res.json({ message: "Tenant deleted" });
  } catch (err) {
    res.status(400).json({ error: "Invalid id" });
  }
});

/* ---------- Leases ---------- */
app.get("/api/leases", async (req, res) => {
  try {
    await Lease.updateMany(
      { ownerId: req.userId, status: "Active", end: { $lt: today() } },
      { status: "Expired" }
    );
    const leases = await Lease.find({ ownerId: req.userId }).sort({ _id: 1 });
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
    const unit = await Unit.findOne({ _id: unitId, ownerId: req.userId });
    if (!unit) return res.status(404).json({ error: "Unit not found" });
    const tenant = await Tenant.findOne({ _id: tenantId, ownerId: req.userId });
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    const lease = await Lease.create({
      unitId, tenantId, start, end, rent, status: "Draft", ownerId: req.userId,
    });
    res.status(201).json(lease);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/leases/:id/sign", async (req, res) => {
  try {
    const lease = await Lease.findOne({ _id: req.params.id, ownerId: req.userId });
    if (!lease) return res.status(404).json({ error: "Lease not found" });
    if (lease.status !== "Draft") {
      return res.status(400).json({ error: "Only draft leases can be signed" });
    }
    const clash = await Lease.findOne({
      unitId: lease.unitId,
      ownerId: req.userId,
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

app.patch("/api/leases/:id", async (req, res) => {
  try {
    const lease = await Lease.findOne({ _id: req.params.id, ownerId: req.userId });
    if (!lease) return res.status(404).json({ error: "Lease not found" });
    for (const k of ["start", "end", "rent"]) {
      if (req.body[k] !== undefined) lease[k] = req.body[k];
    }
    if (lease.end <= lease.start) {
      return res.status(400).json({ error: "End date must be after start date" });
    }
    if (lease.status === "Active") {
      const payments = await Payment.find({
        leaseId: String(lease._id), month: currentMonth(), ownerId: req.userId,
      });
      const paid = payments.reduce((sum, p) => sum + p.amount, 0);
      if (lease.rent < paid) {
        return res
          .status(400)
          .json({ error: `Rent can't be less than what is already paid this month (Rs ${paid})` });
      }
    }
    await lease.save();
    res.json(lease);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/leases/:id", async (req, res) => {
  try {
    const lease = await Lease.findOneAndDelete({ _id: req.params.id, ownerId: req.userId });
    if (!lease) return res.status(404).json({ error: "Lease not found" });
    await Payment.deleteMany({ leaseId: String(lease._id), ownerId: req.userId });
    res.json({ message: "Lease deleted" });
  } catch (err) {
    res.status(400).json({ error: "Invalid id" });
  }
});

/* ---------- Repairs ---------- */
app.get("/api/repairs", async (req, res) => {
  try {
    const repairs = await Repair.find({ ownerId: req.userId }).sort({ _id: 1 });
    res.json({ repairs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/repairs", async (req, res) => {
  try {
    const { unitId, title, priority } = req.body;
    const unit = await Unit.findOne({ _id: unitId, ownerId: req.userId });
    if (!unit) return res.status(404).json({ error: "Unit not found" });
    const repair = await Repair.create({
      unitId, title, priority, status: "Open", ownerId: req.userId,
    });
    res.status(201).json(repair);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch("/api/repairs/:id", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Open", "In progress", "Done"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    const repair = await Repair.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.userId },
      { status },
      { new: true }
    );
    if (!repair) return res.status(404).json({ error: "Repair not found" });
    res.json(repair);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/repairs/:id", async (req, res) => {
  try {
    const repair = await Repair.findOneAndDelete({ _id: req.params.id, ownerId: req.userId });
    if (!repair) return res.status(404).json({ error: "Repair not found" });
    res.json({ message: "Repair deleted" });
  } catch (err) {
    res.status(400).json({ error: "Invalid id" });
  }
});

/* ---------- Payments ---------- */
app.get("/api/payments", async (req, res) => {
  try {
    const month = req.query.month || currentMonth();
    const payments = await Payment.find({ month, ownerId: req.userId }).sort({ _id: 1 });
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

    const lease = await Lease.findOne({ _id: leaseId, ownerId: req.userId });
    if (!lease) return res.status(404).json({ error: "Lease not found" });
    if (lease.status !== "Active") {
      return res.status(400).json({ error: "Only active leases can receive payments" });
    }

    const month = currentMonth();
    const earlier = await Payment.find({ leaseId, month, ownerId: req.userId });
    const paidSoFar = earlier.reduce((sum, p) => sum + p.amount, 0);
    if (paidSoFar + value > lease.rent) {
      return res
        .status(400)
        .json({ error: `Payment is more than the balance (Rs ${lease.rent - paidSoFar})` });
    }

    const payment = await Payment.create({ leaseId, amount: value, month, ownerId: req.userId });
    res.status(201).json(payment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/payments/:id", async (req, res) => {
  try {
    const payment = await Payment.findOneAndDelete({ _id: req.params.id, ownerId: req.userId });
    if (!payment) return res.status(404).json({ error: "Payment not found" });
    res.json({ message: "Payment deleted" });
  } catch (err) {
    res.status(400).json({ error: "Invalid id" });
  }
});

app.use("/api/settings", settingsRouter);
app.use("/api/ai", aiRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
}

module.exports = app;