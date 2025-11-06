// server/store.cjs — single source of truth cho USERS
let NEXT_ID = 4;

let USERS = [
  { id: 1, username: "admin",   password: "admin",   role: "admin",   name: "Administrator", phone: "0900000000", autoLogoutMinutes: 10 },
  { id: 2, username: "manager", password: "manager", role: "manager", name: "Manager User",  phone: "0900000001", autoLogoutMinutes: 10 },
  { id: 3, username: "staff",   password: "staff",   role: "staff",   name: "Staff User",    phone: "0900000002", autoLogoutMinutes: null }
];

function listUsers() {
  // không trả password ra ngoài
  return USERS.map(({ password, ...rest }) => rest);
}

function findById(id) {
  return USERS.find(u => u.id === id);
}

function findByUsernamePassword(username, password) {
  return USERS.find(u => u.username === username && u.password === password);
}

function createUser({ username, password, role, name, phone, autoLogoutMinutes = null }) {
  if (!username || !password) throw new Error("USERNAME_AND_PASSWORD_REQUIRED");
  if (USERS.some(u => u.username === username)) throw new Error("USERNAME_EXISTS");
  const user = { id: NEXT_ID++, username, password, role, name, phone, autoLogoutMinutes };
  USERS.push(user);
  const { password: _pw, ...safe } = user;
  return safe;
}

function updateUser(id, patch) {
  const idx = USERS.findIndex(u => u.id === id);
  if (idx === -1) throw new Error("NOT_FOUND");
  // đổi username phải unique
  if (patch.username && USERS.some(u => u.username === patch.username && u.id !== id)) {
    throw new Error("USERNAME_EXISTS");
  }
  USERS[idx] = { ...USERS[idx], ...patch };
  const { password: _pw, ...safe } = USERS[idx];
  return safe;
}

function deleteUser(id) {
  USERS = USERS.filter(u => u.id !== id);
}

module.exports = {
  listUsers,
  findById,
  findByUsernamePassword,
  createUser,
  updateUser,
  deleteUser,
};
