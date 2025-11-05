"use client";
import { useState } from "react";
import RequireAuth from "../../_components/RequireAuth";
import { getAuth } from "../../_lib/auth-client";

export default function ExportPage() {
  return (
    <RequireAuth allowRoles={["manager","admin"]}>
      <Content />
    </RequireAuth>
  );
}

function Content() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState("all");
  const auth = getAuth();

  async function download(url, filename) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${auth?.token}` }});
    if (!res.ok) { alert("Không thể tải CSV"); return; }
    const blob = await res.blob();
    const a = document.createElement("a"); const link = URL.createObjectURL(blob);
    a.href = link; a.download = filename; a.click(); URL.revokeObjectURL(link);
  }

  function onExportTx() {
    const qs = new URLSearchParams({ from, to, phone, type }).toString();
    download(`/api/export/transactions?${qs}`, "transactions.csv");
  }
  function onExportCustomers() {
    download(`/api/export/customers`, "customers.csv");
  }

  return (
    <div className="card">
      <h2 style={{fontSize:'1.25rem', marginBottom:'.5rem'}}>Xuất CSV</h2>
      <div style={{display:'grid',gap:'.5rem',gridTemplateColumns:'1fr 1fr'}}>
        <div><label>Từ ngày</label><input type="date" value={from} onChange={e=>setFrom(e.target.value)} /></div>
        <div><label>Đến ngày</label><input type="date" value={to} onChange={e=>setTo(e.target.value)} /></div>
        <div><label>SĐT</label><input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="090..." /></div>
        <div><label>Loại</label>
          <select value={type} onChange={e=>setType(e.target.value)}>
            <option value="all">Tất cả</option>
            <option value="earn">Tích điểm</option>
            <option value="redeem">Đổi điểm</option>
          </select>
        </div>
      </div>
      <div style={{display:'flex',gap:'.5rem', marginTop:'.5rem'}}>
        <button onClick={onExportTx}>Tải transactions.csv</button>
        <button onClick={onExportCustomers}>Tải customers.csv</button>
      </div>
    </div>
  );
}
