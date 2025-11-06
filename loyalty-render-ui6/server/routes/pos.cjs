const express = require("express");
const prisma = require("../prisma.cjs");
const { authMiddleware } = require("../utils/auth.cjs");
const router = express.Router();

function calcEarnPoints(amountVND) {
  const f = amountVND / 1000;
  const base = Math.floor(f);
  const frac = f - base;
  return base + (frac > 0 && frac < 0.5 ? 1 : (frac >= 0.5 ? 2 : 0));
}

router.post("/order", authMiddleware, async (req, res) => {
  const { phone, nameIfNew="", amountVND, redeemPoints=0, invoiceCode="", staffName="" } = req.body || {};
  const amount = Number(amountVND||0);
  let redeem = Math.max(0, Number(redeemPoints||0));
  if (!phone) return res.status(400).json({ error: "PHONE_REQUIRED" });
  if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ error: "AMOUNT_INVALID" });

  // upsert customer
  let customer = await prisma.customer.upsert({
    where: { phone: String(phone) },
    update: {},
    create: { phone: String(phone), name: String(nameIfNew||"") || `Khách ${phone}`, points: 0 }
  });

  const maxRedeemRule = 10000;
  const minRedeemRule = 50;
  const maxRedeemByAmount = Math.floor(amount / 10);
  const maxRedeemByBalance = customer.points;
  const maxRedeem = Math.max(0, Math.min(maxRedeemRule, maxRedeemByAmount, maxRedeemByBalance));

  if (redeem > 0) {
    if (redeem < minRedeemRule) return res.status(400).json({ error: "REDEEM_TOO_SMALL" });
    if (redeem > maxRedeem) return res.status(400).json({ error: "REDEEM_TOO_LARGE", maxRedeem });
  } else redeem = 0;

  const earn = calcEarnPoints(amount);

  // transaction
  const now = new Date();
  const ops = [];
  if (redeem > 0) {
    ops.push(prisma.tx.create({
      data: { time: now, kind: 'redeem', phone: customer.phone, name: customer.name,
              points: -redeem, amountVND: redeem*10, invoiceCode, staffName,
              customerId: customer.id }
    }));
  }
  ops.push(prisma.tx.create({
    data: { time: now, kind: 'earn', phone: customer.phone, name: customer.name,
            points: earn, amountVND: amount, invoiceCode, staffName,
            customerId: customer.id }
  }));

  // update points
  ops.push(prisma.customer.update({
    where: { id: customer.id },
    data: { points: customer.points - redeem + earn }
  }));

  const [, , updated] = await prisma.$transaction(ops);
  customer = updated;

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
