const express = require("express");
const prisma = require("../prisma.cjs");
const { authMiddleware, requireRole } = require("../utils/auth.cjs");
const router = express.Router();

router.get("/", authMiddleware, requireRole(["admin"]), async (_req, res) => {
  const users = await prisma.user.findMany();
  res.json({ users: users.map(({password, ...u}) => u) });
});

router.post("/", authMiddleware, requireRole(["admin"]), async (req, res) => {
  try {
    const b = req.body || {};
    const data = {
      username: String(b.username||"").trim(),
      password: String(b.password||"").trim(),
      role: b.role || "staff",
      name: String(b.name||"").trim(),
      phone: String(b.phone||"").trim().replace(/[^\d]/g,""),
      autoLogoutMinutes: b.autoLogoutMinutes === "" ? null : b.autoLogoutMinutes
    };
    const created = await prisma.user.create({ data });
    const { password, ...safe } = created;
    res.status(201).json({ user: safe });
  } catch (e) {
    if (String(e.message||"").includes("Unique constraint") || String(e.code) === "P2002") {
      return res.status(409).json({ error: "USERNAME_EXISTS" });
    }
    res.status(400).json({ error: "BAD_REQUEST" });
  }
});

router.put("/:id", authMiddleware, requireRole(["admin"]), async (req, res) => {
  const id = Number(req.params.id);
  const { name, phone, username, role, autoLogoutMinutes, resetPassword } = req.body || {};
  const patch = {
    ...(name !== undefined ? { name } : {}),
    ...(phone !== undefined ? { phone: String(phone).replace(/[^\d]/g,"") } : {}),
    ...(username !== undefined ? { username } : {}),
    ...(role !== undefined ? { role } : {}),
    ...(autoLogoutMinutes !== undefined ? { autoLogoutMinutes } : {}),
  };
  if (resetPassword && String(resetPassword).length > 0) patch.password = String(resetPassword);

  try {
    const updated = await prisma.user.update({ where: { id }, data: patch });
    const { password, ...safe } = updated;
    res.json({ ok: true, user: safe });
  } catch (e) {
    if (String(e.code) === "P2002") return res.status(409).json({ error: "USERNAME_EXISTS" });
    if (String(e.code) === "P2025") return res.status(404).json({ error: "NOT_FOUND" });
    res.status(400).json({ error: "BAD_REQUEST" });
  }
});

router.delete("/:id", authMiddleware, requireRole(["admin"]), async (req, res) => {
  const id = Number(req.params.id);
  await prisma.user.delete({ where: { id } }).catch(()=>{});
  res.json({ ok: true });
});

module.exports = router;
