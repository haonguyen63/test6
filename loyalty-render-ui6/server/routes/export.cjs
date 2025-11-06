const express = require("express");
const { authMiddleware, requireRole } = require("../utils/auth.cjs");
const { Parser } = require("json2csv");
const prisma = require("../prisma.cjs");
const router = express.Router();

router.get("/customers", authMiddleware, requireRole(["manager","admin"]), async (_req, res) => {
  const customers = await prisma.customer.findMany({ orderBy: { id: 'asc' }});
  const parser = new Parser();
  const csv = parser.parse(customers);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=customers.csv");
  res.send(csv);
});

router.get("/transactions", authMiddleware, requireRole(["manager","admin"]), async (req, res) => {
  const { from, to, phone, type = "all" } = req.query;
  const where = {};
  if (from || to) {
    where.time = {};
    if (from) where.time.gte = new Date(from + "T00:00:00Z");
    if (to)   where.time.lte = new Date(to   + "T23:59:59Z");
  }
  if (phone) where.phone = String(phone);
  if (type !== "all") where.kind = String(type);

  const txs = await prisma.tx.findMany({ where, orderBy: { time: 'asc' }});
  const parser = new Parser({
    fields: [
      { label: "Thời gian", value: row => new Date(row.time).toISOString() },
      { label: "Loại", value: "kind" },
      { label: "SĐT", value: "phone" },
      { label: "Tên KH", value: "name" },
      { label: "Điểm (+/-)", value: "points" },
      { label: "Hoá đơn", value: "invoiceCode" },
      { label: "Nhân viên", value: "staffName" },
      { label: "Giá trị (VND)", value: "amountVND" }
    ]
  });
  const csv = parser.parse(txs);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=transactions.csv");
  res.send(csv);
});

module.exports = router;
