const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();

const DEMO = [
  { id: 1, username: "admin",   password: "admin",   role: "admin",   name: "Administrator", phone: "0900000000", autoLogoutMinutes: 10 },
  { id: 2, username: "manager", password: "manager", role: "manager", name: "Manager User",  phone: "0900000001", autoLogoutMinutes: 10 },
  { id: 3, username: "staff",   password: "staff",   role: "staff",   name: "Staff User",    phone: "0900000002", autoLogoutMinutes: null }
];

router.post("/login", (req, res) => {
  const { username, password } = req.body || {};
  const user = DEMO.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: "INVALID_CREDENTIALS" });
  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || "devsecret", { expiresIn: "7d" });
  res.json({ token, user: { id:user.id, name:user.name, username:user.username, role:user.role, phone:user.phone, autoLogoutMinutes:user.autoLogoutMinutes } });
});

module.exports = router;
