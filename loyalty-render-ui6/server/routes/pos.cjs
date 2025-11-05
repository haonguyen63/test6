const express = require("express");
const { authMiddleware } = require("../utils/auth.cjs");
const { upsertCustomerByPhone, txs } = require("../db.cjs");
const router = express.Router();

/** Quy ước đổi điểm:
 *  1.000đ chi tiêu = 1 điểm (pointsFloat = amount/1000).
 *  Làm tròn phần lẻ:
 *   - 0   – <0.5  -> +1 điểm
 *   - 0.5 – <1.0  -> +2 điểm
 *  Ví dụ: 2.30 điểm  -> 2 + 1 = 3; 1.75 -> 1 + 2 = 3
 *  Đổi điểm: 1 điểm = 10đ. Min 50 (500đ), Max 10.000 (100.000đ), và không vượt quá giá trị đơn hàng.
 */
function calcEarnPoints(amountVND) {
  const pointsFloat = amountVND / 1000;
  const base = Math.floor(pointsFloat);
  const frac = pointsFloat - base;
  let extra = 0;
  if (frac > 0 && frac < 0.5) extra = 1;
  else if (frac >= 0.5) extra = 2;
  return base + extra;
}

router.post("/order", authMiddleware, (req, res) => {
  const { phone, nameIfNew = "", amountVND, redeemPoints = 0, invoiceCode = "", staffName = "" } = req.body || {};
  const amount = Number(amountVND || 0);
  let redeem = Math.max(0, Number(redeemPoints || 0));

  if (!phone) return res.status(400).json({ error: "PHONE_REQUIRED" });
  if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ error: "AMOUNT_INVALID" });

  const customer = upsertCustomerByPhone(String(phone), String(nameIfNew || "").trim());

  // ràng buộc đổi điểm
  const maxRedeemByRule = 10000; // điểm
  const minRedeemByRule = 50;    // điểm
  const maxRedeemByAmount = Math.floor(amount / 10); // không vượt giá trị đơn hàng (1đ = 10đ)
  const maxRedeem = Math.min(maxRedeemByRule, maxRedeemByAmount, customer.points);

  if (redeem > 0) {
    if (redeem < minRedeemByRule) return res.status(400).json({ error: "REDEEM_TOO_SMALL" });
    if (redeem > maxRedeem) return res.status(400).json({ error: "REDEEM_TOO_LARGE", maxRedeem });
  } else {
    redeem = 0;
  }

  // tính điểm tích
  const earn = calcEarnPoints(amount);

  // cập nhật điểm
  customer.points = customer.points - redeem + earn;

  // ghi lịch sử (2 bản ghi tách bạch để xuất CSV)
  const now = new Date();
  if (redeem > 0) {
    txs.push({
      time: now, kind: "redeem", phone: customer.phone, name: customer.name,
      points: -redeem, amountVND: redeem * 10, invoiceCode, staffName
    });
  }
  txs.push({
    time: now, kind: "earn", phone: customer.phone, name: customer.name,
    points: earn, amountVND: amount, invoiceCode, staffName
  });

  res.json({
    ok: true,
    summary: {
      phone: customer.phone,
      name: customer.name,
      amountVND: amount,
      redeemPoints: redeem,
      redeemValueVND: redeem * 10,
      earnPoints: earn,
      newBalance: customer.points
    }
  });
});

module.exports = router;
