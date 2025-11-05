const express = require("express");
const { authMiddleware } = require("../utils/auth.cjs");
const { customers, upsertCustomerByPhone } = require("../db.cjs");
const router = express.Router();

// GET /api/customers/find?phone=09...
router.get("/find", authMiddleware, (req, res) => {
  const phone = String(req.query.phone || "").trim();
  const c = customers.find(x => x.phone === phone);
  if (!c) return res.status(404).json({ error: "NOT_FOUND" });
  res.json({ customer: c });
});

// POST /api/customers/create { phone, name }
router.post("/create", authMiddleware, (req, res) => {
  const { phone, name } = req.body || {};
  if (!phone) return res.status(400).json({ error: "PHONE_REQUIRED" });
  const c = upsertCustomerByPhone(String(phone), String(name || "").trim());
  res.json({ customer: c });
});

module.exports = router;
