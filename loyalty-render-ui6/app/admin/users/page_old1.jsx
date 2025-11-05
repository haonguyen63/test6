"use client";
import { useEffect, useState } from "react";
import RequireAuth from "../../_components/RequireAuth";
import { getAuth } from "../../_lib/auth-client";
import { safeFetchJSON } from "../../_lib/safe-fetch";

export default function UsersPage() {
  return (
    <RequireAuth allowRoles="admin">
      <UsersContent />
    </RequireAuth>
  );
}

function UsersContent() {
  const auth = getAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [err, setErr] = useState("");

  async function load() {
    try{
      setLoading(true);
      const data = await safeFetchJSON("/api/users", {
        headers: { Authorization: `Bearer ${auth?.token}` }
      });
      setList(data.users || []);
    }catch(e){ setErr(e.message); }
    finally{ setLoading(false); }
  }

  useEffect(() => { load(); }, []);
  function pick(u) { setEditing({ ...u }); }

  async function saveEdit() {
    try{
      const payload = {
        name: editing.name, phone: editing.phone, username: editing.username, role: editing.role,
        autoLogoutMinutes: editing.autoLogoutMinutes ? Number(editing.autoLogoutMinutes) : null
      };
      await safeFetchJSON(`/api/users/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth?.token}` },
        body: JSON.stringify(payload)
      });
      setEditing(null); load();
    }catch(e){ alert(e.message); }
  }

  async function remove(id) {
    if (!confirm("Xoá user này?")) return;
    try{
      await safeFetchJSON(`/api/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${auth?.token}` }
      });
      load();
    }catch(e){ alert(e.message); }
  }

  if (loading) return null;
  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">Quản trị người dùng</h2>
      {err && <p style={{color:'#f87171'}}>{err}</p>}
      <ul>
        {list.map(u => (
          <li key={u.id} style={{display:'flex', justifyContent:'space-between', padding:'.5rem 0', borderBottom:'1px solid #222'}} onClick={() => pick(u)}>
            <span><b>{u.role}</b> — {u.name} — {u.username || u.phone}</span>
            <button onClick={(e)=>{e.stopPropagation(); remove(u.id);}}>Xoá</button>
          </li>
        ))}
      </ul>

      {editing && (
        <div className="card" style={{marginTop:'.75rem'}}>
          <h3 className="font-semibold mb-3">Sửa user</h3>
          <div style={{display:'grid',gap:'.5rem',maxWidth:'480px'}}>
            <input placeholder="Họ tên" value={editing.name||""} onChange={e=>setEditing(v=>({...v,name:e.target.value}))}/>
            <input placeholder="SĐT" value={editing.phone||""} onChange={e=>setEditing(v=>({...v,phone:e.target.value}))}/>
            <input placeholder="Username" value={editing.username||""} onChange={e=>setEditing(v=>({...v,username:e.target.value}))}/>
            <select value={editing.role} onChange={e=>setEditing(v=>({...v,role:e.target.value}))}>
              <option value="staff">Nhân viên</option>
              <option value="manager">Quản lý</option>
              <option value="admin">Admin</option>
            </select>
            <input type="number" min="0" placeholder="Auto logout (phút). 0 = tắt"
                   value={editing.autoLogoutMinutes ?? ""}
                   onChange={e=>setEditing(v=>({...v, autoLogoutMinutes: e.target.value}))}/>
          </div>
          <div style={{display:'flex',gap:'.5rem',marginTop:'.5rem'}}>
            <button onClick={saveEdit}>Lưu</button>
            <button onClick={()=>setEditing(null)}>Huỷ</button>
          </div>
        </div>
      )}
    </div>
  );
}
