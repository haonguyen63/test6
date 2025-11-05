"use client";
import { useState } from "react";
import { safeFetchJSON } from "../_lib/safe-fetch";
import { setAuth } from "../_lib/auth-client";

export default function LoginPage() {
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [msg, setMsg] = useState("");

  async function onSubmit(e){
    e.preventDefault();
    setMsg("");
    try{
      const data = await safeFetchJSON("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      setAuth({ token: data.token, user: data.user });
      location.href = "/pos";
    }catch(err){
      setMsg(err.message || "Đăng nhập thất bại");
      console.error("LoginError:", err);
    }
  }

  return (
    <div className="card">
      <h1 style={{fontSize:'1.25rem', marginBottom:'.5rem'}}>Đăng nhập</h1>
      <form onSubmit={onSubmit} style={{display:'grid', gap:'.5rem', maxWidth:'360px'}}>
        <input placeholder="username" value={username} onChange={e=>setU(e.target.value)} />
        <input placeholder="password" type="password" value={password} onChange={e=>setP(e.target.value)} />
        <button type="submit">Đăng nhập</button>
        {msg && <p style={{color:'#f87171'}}>{msg}</p>}
      </form>
      <p style={{marginTop:'.5rem'}}>Demo: <code>admin/admin</code>, <code>manager/manager</code>, <code>staff/staff</code></p>
    </div>
  );
}
