"use client";
import { getAuth, clearAuth, stopAutoLogout } from "../_lib/auth-client";
import { useEffect, useState } from "react";

export default function Nav() {
  const [auth, setAuth] = useState(null);
  useEffect(() => { setAuth(getAuth()); }, []);
  function logout(){ stopAutoLogout(); clearAuth(); location.href="/login"; }
  return (
    <nav style={{display:'flex',gap:'1rem',padding:'1rem',borderBottom:'1px solid #222'}}>
      <a href="/">Trang chủ</a>
      {auth?.user?.role && (<a href="/pos">Bán hàng</a>)}
      {(auth?.user?.role === "manager" || auth?.user?.role === "admin") && (<a href="/manager/export">Xuất CSV</a>)}
      {auth?.user?.role === "admin" && (<a href="/admin/users">Quản trị</a>)}
      <span style={{flex:1}}/>
      {!auth ? <a href="/login">Đăng nhập</a> : <button onClick={logout}>Đăng xuất</button>}
    </nav>
  );
}
