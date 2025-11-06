const express = require("express");
const prisma = require("../prisma.cjs");
const { authMiddleware } = require("../utils/auth.cjs");
const router = express.Router();

router.get("/find", authMiddleware, async (req, res) => {
  const phone = String(req.query.phone||"").trim();
  const c = await prisma.customer.findUnique({ where: { phone } });
  if (!c) return res.status(404).json({ error: "NOT_FOUND" });
  res.json({ customer: c });
});

router.post("/create", authMiddleware, async (req, res) => {
  const { phone, name } = req.body || {};
  if (!phone) return res.status(400).json({ error: "PHONE_REQUIRED" });
  const c = await prisma.customer.upsert({
    where: { phone: String(phone) },
    update: { name: String(name||"") || undefined },
    create: { phone: String(phone), name: String(name||"") || `Khách ${phone}` }
  });
  res.json({ customer: c });
});

module.exports = router;
