const express = require("express");
const Settings = require("../models/Settings");
const { CURRENCIES } = require("../models/Settings");
const Property = require("../models/Property");
const Unit = require("../models/Unit");
const Tenant = require("../models/Tenant");
const Lease = require("../models/Lease");
const Repair = require("../models/Repair");
const Payment = require("../models/Payment");

const router = express.Router();

// ADAPT: whatever your auth middleware sets (req.userId, req.user.id, ...)
const uid = (req) => req.userId;

router.get("/", async (req, res) => {
  try {
    const s = await Settings.findOne({ ownerId: uid(req) });
    res.json(s ? s.toJSON() : { ownerName: "", currency: "PKR" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/", async (req, res) => {
  try {
    const update = {};
    if (req.body.ownerName !== undefined) update.ownerName = String(req.body.ownerName);
    if (req.body.currency !== undefined) {
      if (!CURRENCIES.includes(req.body.currency)) {
        return res.status(400).json({ error: "Unsupported currency" });
      }
      update.currency = req.body.currency;
    }
    const s = await Settings.findOneAndUpdate({ ownerId: uid(req) }, update, {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    });
    res.json(s.toJSON());
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Everything this user owns, as one JSON object
router.get("/export", async (req, res) => {
  try {
    const f = { ownerId: uid(req) };
    const [settings, properties, units, tenants, leases, repairs, payments] = await Promise.all([
      Settings.findOne(f), Property.find(f), Unit.find(f), Tenant.find(f),
      Lease.find(f), Repair.find(f), Payment.find(f),
    ]);
    const clean = (docs) =>
      docs.map((d) => {
        const o = d.toJSON();
        delete o.ownerId;
        return o;
      });
    res.json({
      exportedAt: new Date().toISOString(),
      settings: settings ? settings.toJSON() : null,
      properties: clean(properties),
      units: clean(units),
      tenants: clean(tenants),
      leases: clean(leases),
      repairs: clean(repairs),
      payments: clean(payments),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;