const express = require("express");
const { authMiddleware, requireRole } = require("../utils/auth.cjs");
const { Parser } = require("json2csv");
const router = express.Router();

const customers = [
  { id: 1, name: "Nguyễn A", phone: "0900000000", points: 120, createdAt: new Date("2024-01-10") },
  { id: 2, name: "Trần B",   phone: "0900000001", points: 50,  createdAt: new Date("2024-02-05") }
];
const txs = [
  { createdAt: new Date("2024-02-01T10:00:00Z"), kind: "earn",   customerPhone: "0900000000", customerName: "Nguyễn A", points: 20,  invoiceCode: "HD001", staffName: "Staff User" },
  { createdAt: new Date("2024-02-02T12:00:00Z"), kind: "redeem", customerPhone: "0900000000", customerName: "Nguyễn A", points: -10, invoiceCode: "HD002", staffName: "Staff User" },
  { createdAt: new Date("2024-03-03T09:33:00Z"), kind: "earn",   customerPhone: "0900000001", customerName: "Trần B",   points: 50,  invoiceCode: "HD003", staffName: "Manager User" }
];

router.get("/customers", authMiddleware, requireRole(["manager","admin"]), async (_req, res) => {
  const parser = new Parser(); const csv = parser.parse(customers);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=customers.csv");
  res.send(csv);
});

router.get("/transactions", authMiddleware, requireRole(["manager","admin"]), async (req, res) => {
  const { from, to, phone, type = "all" } = req.query;
  let data = txs.slice();
  if (from) data = data.filter(r => new Date(r.createdAt) >= new Date(from+"T00:00:00Z"));
  if (to)   data = data.filter(r => new Date(r.createdAt) <= new Date(to+"T23:59:59Z"));
  if (phone) data = data.filter(r => r.customerPhone === phone);
  if (type !== "all") data = data.filter(r => r.kind === type);
  const parser = new Parser({ fields: [
    { label: "Thời gian", value: row => new Date(row.createdAt).toISOString() },
    { label: "Loại", value: "kind" },
    { label: "SĐT", value: "customerPhone" },
    { label: "Tên KH", value: "customerName" },
    { label: "Điểm (+/-)", value: "points" },
    { label: "Hoá đơn", value: "invoiceCode" },
    { label: "Nhân viên", value: "staffName" }
  ]});
  const csv = parser.parse(data);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=transactions.csv");
  res.send(csv);
});

module.exports = router;
