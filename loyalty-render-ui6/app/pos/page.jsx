"use client";
import RequireAuth from "../_components/RequireAuth";

export default function PosPage() {
  return (
    <RequireAuth allowRoles={["staff","manager","admin"]}>
      <div className="card">
        <h1 style={{fontSize:'1.25rem'}}>Bán hàng</h1>
        <p>Demo POS page (chỉ hiển thị sau khi đăng nhập).</p>
      </div>
    </RequireAuth>
  );
}
