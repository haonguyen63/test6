"use client";
import { useEffect, useMemo, useState } from "react";
import RequireAuth from "../_components/RequireAuth";
import { getAuth } from "../_lib/auth-client";
import { safeFetchJSON } from "../_lib/safe-fetch";

function fmtMoney(v) {
  const n = Number(v || 0);
  return n.toLocaleString("en-US");
}

export default function PosPage() {
  return (
    <RequireAuth allowRoles={["staff","manager","admin"]}>
      <PosContent />
    </RequireAuth>
  );
}

function PosContent() {
  const auth = getAuth();
  const [phone, setPhone] = useState("");
  const [nameNew, setNameNew] = useState("");
  const [customer, setCustomer] = useState(null); // {name, phone, points}
  const [amountStr, setAmountStr] = useState("250000");
  const [redeem, setRedeem] = useState(0);
  const [msg, setMsg] = useState("");

  // auto tìm khách theo số điện thoại (debounce)
  useEffect(() => {
    if (!phone || phone.length < 6) { setCustomer(null); return; }
    const t = setTimeout(async () => {
      try {
        const data = await safeFetchJSON(`/api/customers/find?phone=${encodeURIComponent(phone)}`, {
          headers: { Authorization: `Bearer ${auth?.token}` }
        });
        setCustomer(data.customer);
        setNameNew(data.customer.name || "");
      } catch {
        setCustomer(null);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [phone]);

  async function createIfNotExists() {
    if (!phone) return;
    try {
      const data = await safeFetchJSON("/api/customers/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth?.token}`
        },
        body: JSON.stringify({ phone, name: nameNew })
      });
      setCustomer(data.customer);
      setMsg("Đã tạo khách mới.");
    } catch (e) {
      setMsg(e.message);
    }
  }

  // parse amount with commas
  const amount = useMemo(() => {
    const raw = String(amountStr || "").replace(/,/g, "");
    const n = Math.max(0, parseInt(raw || "0", 10));
    return Number.isFinite(n) ? n : 0;
  }, [amountStr]);

  // tính điểm tích theo rule làm tròn
  const earnPoints = useMemo(() => {
    const f = amount / 1000;
    const base = Math.floor(f);
    const frac = f - base;
    let extra = 0;
    if (frac > 0 && frac < 0.5) extra = 1;
    else if (frac >= 0.5) extra = 2;
    return base + extra;
  }, [amount]);

  // giới hạn đổi điểm
  const maxRedeemByRule = 10000; // 10.000 điểm = 100.000đ
  const minRedeemByRule = 50;    // 50 điểm = 500đ
  const maxRedeemByAmount = Math.floor(amount / 10); // 1 điểm = 10đ
  const maxRedeemByBalance = customer?.points ?? 0;
  const maxRedeem = Math.max(0, Math.min(maxRedeemByRule, maxRedeemByAmount, maxRedeemByBalance));

  useEffect(() => {
    // clamp redeem khi thay đổi dữ liệu
    setRedeem(r => Math.min(Math.max(r, 0), maxRedeem));
  }, [maxRedeem]);

  function onAmountChange(v) {
    const raw = v.replace(/[^\d]/g, "");
    if (!raw) { setAmountStr(""); return; }
    // format theo nhóm nghìn
    const formatted = Number(raw).toLocaleString("en-US");
    setAmountStr(formatted);
  }

  async function submitOrder() {
    setMsg("");
    try {
      const payload = {
        phone,
        nameIfNew: nameNew,
        amountVND: amount,
        redeemPoints: redeem,
        invoiceCode: "",
        staffName: auth?.user?.name || ""
      };
      const data = await safeFetchJSON("/api/pos/order", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth?.token}` },
        body: JSON.stringify(payload)
      });
      // cập nhật giao diện
      setCustomer(c => c ? { ...c, points: data.summary.newBalance } : null);
      setRedeem(0);
      setMsg(`Tạo đơn thành công. +${data.summary.earnPoints} điểm, đổi ${data.summary.redeemPoints} điểm. Số dư mới: ${data.summary.newBalance}`);
    } catch (e) {
      setMsg(e.message);
    }
  }

  return (
    <div className="card">
      <h2 style={{fontSize:"1.25rem", marginBottom:".75rem"}}>Điểm bán hàng</h2>

      {/* Hàng nhập khách */}
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:".75rem"}}>
        <div>
          <div>Số điện thoại khách</div>
          <input
            value={phone}
            onChange={e => setPhone(e.target.value.replace(/[^\d]/g,""))}
            placeholder="0912345678" />
        </div>
        <div>
          <div>Tên khách (nếu tạo mới)</div>
          <input value={nameNew} onChange={e=>setNameNew(e.target.value)} placeholder="Nguyễn Văn A" />
        </div>
      </div>

      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:".75rem", marginTop:".5rem"}}>
        <button onClick={createIfNotExists}>Tạo khách (nếu chưa có)</button>
        <span />
      </div>

      <hr style={{borderColor:"#222", margin:"1rem 0"}}/>

      {/* Thông tin khách nếu có */}
      {customer ? (
        <div className="card" style={{background:"#0f1115"}}>
          <div style={{display:"flex", gap:"1rem", flexWrap:"wrap"}}>
            <div><b>Khách:</b> {customer.name}</div>
            <div><b>SĐT:</b> {customer.phone}</div>
            <div><b>Điểm hiện có:</b> {fmtMoney(customer.points)}</div>
          </div>
        </div>
      ) : (
        <div style={{opacity:.8}}>Chưa có dữ liệu. Hệ thống sẽ tự tìm khi nhập SĐT, hoặc bấm “Tạo khách”.</div>
      )}

      <hr style={{borderColor:"#222", margin:"1rem 0"}}/>

      {/* Nhập đơn hàng + đổi điểm */}
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:".75rem"}}>
        <div>
          <div>Giá trị đơn (VND)</div>
          <input
            inputMode="numeric"
            value={amountStr}
            onChange={e=>onAmountChange(e.target.value)}
            placeholder="250,000" />
        </div>
        <div>
          <div>Đổi điểm (tùy chọn)</div>
          <input
            type="number"
            min={0}
            max={maxRedeem}
            value={redeem}
            onChange={e => setRedeem(Math.max(0, Math.min(Number(e.target.value||0), maxRedeem)))}
            placeholder="0" />
          <div style={{fontSize:12, opacity:.85, marginTop:4}}>
            Min 50, Max 10,000 (không vượt số dư/giá trị đơn). 1 điểm = 10đ.
            {redeem>0 && <> &nbsp;→ trị giá {fmtMoney(redeem*10)}đ</>}
          </div>
        </div>
      </div>

      {/* Tính trước điểm tích được */}
      <div style={{marginTop:".5rem", opacity:.9}}>
        Dự kiến tích: <b>{fmtMoney(earnPoints)}</b> điểm &nbsp;
        (quy đổi 1.000đ = 1đ, phần lẻ &lt;0.5 → +1đ; ≥0.5 → +2đ)
      </div>

      <div style={{marginTop:".75rem"}}>
        <button onClick={submitOrder} style={{width:"100%"}}>Tạo đơn</button>
      </div>

      {msg && <div style={{marginTop:".75rem", color:"#93c5fd"}}>{msg}</div>}
    </div>
  );
}
