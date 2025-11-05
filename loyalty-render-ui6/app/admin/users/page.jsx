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

function Hint({ children }) {
  return <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>{children}</div>;
}
function Label({ children }) {
  return <div style={{ fontWeight: 500, marginBottom: 6 }}>{children}</div>;
}

function UsersContent() {
  const auth = getAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [err, setErr] = useState("");
  const [creating, setCreating] = useState({
    name: "",
    phone: "",
    username: "",
    password: "",
    role: "staff",
    autoLogoutMinutes: ""
  });

  async function load() {
    try {
      setLoading(true);
      const data = await safeFetchJSON("/api/users", {
        headers: { Authorization: `Bearer ${auth?.token}` },
      });
      setList(data.users || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  function pick(u) { setEditing({ ...u, resetPassword: "" }); }

  async function saveEdit() {
    try {
      const payload = {
        name: editing.name,
        phone: editing.phone,
        username: editing.username,
        role: editing.role,
        autoLogoutMinutes:
          editing.autoLogoutMinutes === "" || editing.autoLogoutMinutes === null
            ? null
            : Number(editing.autoLogoutMinutes),
        resetPassword: editing.resetPassword || "" // chỉ gửi khi có giá trị
      };
      await safeFetchJSON(`/api/users/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth?.token}` },
        body: JSON.stringify(payload),
      });
      setEditing(null);
      load();
    } catch (e) {
      alert(e.message);
    }
  }

  async function remove(id) {
    if (!confirm("Xoá user này?")) return;
    try {
      await safeFetchJSON(`/api/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${auth?.token}` },
      });
      load();
    } catch (e) {
      alert(e.message);
    }
  }

  async function createUser() {
    try {
      const payload = {
        ...creating,
        autoLogoutMinutes:
          creating.autoLogoutMinutes === "" || creating.autoLogoutMinutes === null
            ? null
            : Number(creating.autoLogoutMinutes),
      };
      await safeFetchJSON(`/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth?.token}` },
        body: JSON.stringify(payload),
      });
      setCreating({ name: "", phone: "", username: "", password: "", role: "staff", autoLogoutMinutes: "" });
      load();
      alert("Đã tạo tài khoản mới.");
    } catch (e) {
      alert(e.message);
    }
  }

  if (loading) return null;

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">Quản trị người dùng</h2>
      {err && <p style={{ color: "#f87171" }}>{err}</p>}

      {/* Danh sách người dùng */}
      <ul>
        {list.map((u) => (
          <li
            key={u.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: ".6rem 0",
              borderBottom: "1px solid #222",
              cursor: "pointer",
            }}
            onClick={() => pick(u)}
            title="Bấm để sửa"
          >
            <span>
              <b>{u.role}</b> — {u.name} — {u.username || u.phone}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); remove(u.id); }}
            >
              Xoá
            </button>
          </li>
        ))}
      </ul>

      {/* Tạo tài khoản mới */}
      <div className="card" style={{ marginTop: ".9rem" }}>
        <h3 className="font-semibold mb-3">Tạo tài khoản mới</h3>
        <div style={{ display: "grid", gap: ".75rem", maxWidth: 520 }}>
          <div>
            <Label>Họ tên</Label>
            <input
              placeholder="Ví dụ: Nguyễn Văn B"
              value={creating.name}
              onChange={(e) => setCreating(v => ({ ...v, name: e.target.value }))} />
          </div>
          <div>
            <Label>Số điện thoại</Label>
            <input
              inputMode="numeric"
              placeholder="0900000003"
              value={creating.phone}
              onChange={(e) => setCreating(v => ({ ...v, phone: e.target.value.replace(/[^\d]/g,"") }))} />
          </div>
          <div>
            <Label>Username</Label>
            <input
              placeholder="username đăng nhập"
              value={creating.username}
              onChange={(e) => setCreating(v => ({ ...v, username: e.target.value }))} />
            <Hint>Phải là duy nhất. Nếu trùng, hệ thống sẽ báo lỗi.</Hint>
          </div>
          <div>
            <Label>Password</Label>
            <input
              type="password"
              placeholder="mật khẩu ban đầu"
              value={creating.password}
              onChange={(e) => setCreating(v => ({ ...v, password: e.target.value }))} />
          </div>
          <div>
            <Label>Vai trò</Label>
            <select
              value={creating.role}
              onChange={(e) => setCreating(v => ({ ...v, role: e.target.value }))}>
              <option value="staff">Nhân viên</option>
              <option value="manager">Quản lý</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <Label>Auto logout (phút)</Label>
            <input
              type="number"
              min="0"
              placeholder="Ví dụ: 10 (0 = tắt, bỏ trống = mặc định theo vai trò)"
              value={creating.autoLogoutMinutes}
              onChange={(e) => setCreating(v => ({ ...v, autoLogoutMinutes: e.target.value }))} />
          </div>
        </div>
        <div style={{ display: "flex", gap: ".5rem", marginTop: ".75rem" }}>
          <button onClick={createUser}>Tạo tài khoản</button>
        </div>
      </div>

      {/* Sửa user */}
      {editing && (
        <div className="card" style={{ marginTop: ".9rem" }}>
          <h3 className="font-semibold mb-3">Sửa user</h3>
          <div style={{ display: "grid", gap: ".75rem", maxWidth: 520 }}>
            <div>
              <Label>Họ tên</Label>
              <input
                placeholder="Ví dụ: Nguyễn Văn A"
                value={editing.name || ""}
                onChange={(e) => setEditing((v) => ({ ...v, name: e.target.value }))}
              />
            </div>
            <div>
              <Label>Số điện thoại</Label>
              <input
                inputMode="numeric"
                placeholder="Ví dụ: 0900000000"
                value={editing.phone || ""}
                onChange={(e) => setEditing((v) => ({ ...v, phone: e.target.value.replace(/[^\d]/g, "") }))}
              />
            </div>
            <div>
              <Label>Username</Label>
              <input
                placeholder="Ví dụ: admin, test1..."
                value={editing.username || ""}
                onChange={(e) => setEditing((v) => ({ ...v, username: e.target.value }))}
              />
              <Hint>Tên đăng nhập phải là duy nhất trong hệ thống.</Hint>
            </div>
            <div>
              <Label>Vai trò</Label>
              <select
                value={editing.role}
                onChange={(e) => setEditing((v) => ({ ...v, role: e.target.value }))}>
                <option value="staff">Nhân viên</option>
                <option value="manager">Quản lý</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <Label>Thời gian auto logout (phút)</Label>
              <input
                type="number"
                min="0"
                placeholder="Ví dụ: 10 (0 = tắt)"
                value={editing.autoLogoutMinutes ?? ""}
                onChange={(e) => setEditing((v) => ({ ...v, autoLogoutMinutes: e.target.value }))}
              />
            </div>
            <div>
              <Label>Đặt lại mật khẩu (tuỳ chọn)</Label>
              <input
                type="password"
                placeholder="Để trống nếu không đổi"
                value={editing.resetPassword || ""}
                onChange={(e) => setEditing(v => ({ ...v, resetPassword: e.target.value }))}
              />
              <Hint>Nhập mật khẩu mới để reset. Để trống = giữ nguyên.</Hint>
            </div>
          </div>
          <div style={{ display: "flex", gap: ".5rem", marginTop: ".75rem" }}>
            <button onClick={saveEdit}>Lưu</button>
            <button onClick={() => setEditing(null)}>Huỷ</button>
          </div>
        </div>
      )}
    </div>
  );
}
