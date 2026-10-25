const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 4000;
const mongoose = require("mongoose");
const Property = require("./models/Property");

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