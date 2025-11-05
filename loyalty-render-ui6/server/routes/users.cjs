const express = require("express");
const { authMiddleware, requireRole } = require("../utils/auth.cjs");
const router = express.Router();

let USERS = [
  { id: 1, username: "admin",   role: "admin",   name: "Administrator", phone: "0900000000", autoLogoutMinutes: 10 },
  { id: 2, username: "manager", role: "manager", name: "Manager User",  phone: "0900000001", autoLogoutMinutes: 10 },
  { id: 3, username: "staff",   role: "staff",   name: "Staff User",    phone: "0900000002", autoLogoutMinutes: null }
];

router.get("/", authMiddleware, requireRole(["admin"]), async (_req, res) => {
  res.json({ users: USERS });
});

router.put("/:id", authMiddleware, requireRole(["admin"]), async (req, res) => {
  const id = Number(req.params.id);
  const idx = USERS.findIndex(u => u.id === id);
  if (idx === -1) return res.status(404).json({ error: "NOT_FOUND" });
  const { name, phone, username, role, autoLogoutMinutes } = req.body;
  USERS[idx] = { ...USERS[idx], name, phone, username, role, autoLogoutMinutes };
  res.json({ ok: true });
});

router.delete("/:id", authMiddleware, requireRole(["admin"]), async (req, res) => {
  const id = Number(req.params.id);
  USERS = USERS.filter(u => u.id !== id);
  res.json({ ok: true });
});

module.exports = router;
