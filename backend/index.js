const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 4000;
const mongoose = require("mongoose");
const Property = require("./models/Property");
const Tenant = require("./models/Tenant");  

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Mongo connected");
    app.listen(4000, () => console.log("API running on http://localhost:4000"));
  })
  .catch((err) => console.error("Mongo connection failed:", err.message));

app.get("/health", (req, res) => {
    res.json({ status: "ok" });
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