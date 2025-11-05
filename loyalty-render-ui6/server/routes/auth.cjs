const express = require("express");
const jwt = require("jsonwebtoken");
const store = require("../store.cjs");
const router = express.Router();

// POST /api/auth/login {username, password}
router.post("/login", (req, res) => {
  const { username, password } = req.body || {};
  const u = store.findByUsernamePassword(String(username||""), String(password||""));
  if (!u) return res.status(401).json({ error: "INVALID_CREDENTIALS" });

  const token = jwt.sign({ id: u.id, role: u.role }, process.env.JWT_SECRET || "devsecret", { expiresIn: "7d" });
  const user = store.findById(u.id);
  const { password: _pw, ...safe } = user;
  res.json({ token, user: safe });
});

module.exports = router;
