const express = require("express");
const { authMiddleware, requireRole } = require("../utils/auth.cjs");
const store = require("../store.cjs");
const router = express.Router();

// GET /api/users
router.get("/", authMiddleware, requireRole(["admin"]), (_req, res) => {
  res.json({ users: store.listUsers() });
});

// POST /api/users  — tạo mới
// body: {username, password, name, phone, role, autoLogoutMinutes}
router.post("/", authMiddleware, requireRole(["admin"]), (req, res) => {
  try {
    const payload = req.body || {};
    const created = store.createUser({
      username: String(payload.username || "").trim(),
      password: String(payload.password || "").trim(),
      name: String(payload.name || "").trim(),
      phone: String(payload.phone || "").trim().replace(/[^\d]/g, ""),
      role: payload.role || "staff",
      autoLogoutMinutes: payload.autoLogoutMinutes === "" ? null : payload.autoLogoutMinutes
    });
    res.status(201).json({ user: created });
  } catch (e) {
    const code = e.message === "USERNAME_EXISTS" ? 409 : 400;
    res.status(code).json({ error: e.message });
  }
});

// PUT /api/users/:id — update + reset password (nếu có resetPassword)
router.put("/:id", authMiddleware, requireRole(["admin"]), (req, res) => {
  const id = Number(req.params.id);
  const { name, phone, username, role, autoLogoutMinutes, resetPassword } = req.body || {};
  try {
    const patch = {
      ...(name !== undefined ? { name } : {}),
      ...(phone !== undefined ? { phone: String(phone).replace(/[^\d]/g,"") } : {}),
      ...(username !== undefined ? { username } : {}),
      ...(role !== undefined ? { role } : {}),
      ...(autoLogoutMinutes !== undefined ? { autoLogoutMinutes } : {})
    };
    if (resetPassword && String(resetPassword).length > 0) {
      patch.password = String(resetPassword);
    }
    const updated = store.updateUser(id, patch);
    res.json({ ok: true, user: updated });
  } catch (e) {
    const code = e.message === "USERNAME_EXISTS" ? 409 : (e.message === "NOT_FOUND" ? 404 : 400);
    res.status(code).json({ error: e.message });
  }
});

// DELETE /api/users/:id
router.delete("/:id", authMiddleware, requireRole(["admin"]), (req, res) => {
  const id = Number(req.params.id);
  store.deleteUser(id);
  res.json({ ok: true });
});

module.exports = router;
