const express = require("express");
const jwt = require("jsonwebtoken");
const prisma = require("../prisma.cjs");
const router = express.Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body || {};
  const user = await prisma.user.findUnique({ where: { username: String(username||"") } });
  if (!user || user.password !== String(password||"")) {
    return res.status(401).json({ error: "INVALID_CREDENTIALS" });
  }
  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || "devsecret", { expiresIn: "7d" });
  const { password: _pw, ...safe } = user;
  res.json({ token, user: safe });
});

module.exports = router;
