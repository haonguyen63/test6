let inactivityTimer = null;
let lastActivityAt = Date.now();

export function getAuth() {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem("auth") || "null"); }
  catch { return null; }
}
export function setAuth(auth) { localStorage.setItem("auth", JSON.stringify(auth)); }
export function clearAuth() { localStorage.removeItem("auth"); stopAutoLogout(); }
export function hasRole(required, userRole) {
  if (!userRole) return false;
  const order = ["staff","manager","admin"];
  const need = Array.isArray(required) ? required : [required];
  const idxUser = order.indexOf(userRole);
  return need.some(r => order.indexOf(r) <= idxUser);
}
export function startAutoLogout({ onLogout } = {}) {
  const auth = getAuth();
  if (!auth) return;
  const minutesCfg = Number(auth?.user?.autoLogoutMinutes ?? auth?.autoLogoutMinutes);
  const role = auth?.user?.role ?? auth?.role;
  let minutes = Number.isFinite(minutesCfg) && minutesCfg > 0 ? minutesCfg :
    (role === "manager" || role === "admin") ? 10 : 0;
  stopAutoLogout();
  if (!minutes) return;
  const ms = minutes * 60 * 1000;
  const resetTimer = () => {
    lastActivityAt = Date.now();
    if (inactivityTimer) clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      if (Date.now() - lastActivityAt >= ms) typeof onLogout === "function" && onLogout();
      else resetTimer();
    }, ms);
  };
  const events = ["click","mousemove","keydown","scroll","touchstart","touchmove","visibilitychange"];
  events.forEach(ev => window.addEventListener(ev, resetTimer, { passive: true }));
  window.__autoLogoutDetach = () => { events.forEach(ev => window.removeEventListener(ev, resetTimer)); };
  resetTimer();
}
export function stopAutoLogout() {
  if (inactivityTimer) clearTimeout(inactivityTimer);
  inactivityTimer = null;
  if (typeof window !== "undefined" && window.__autoLogoutDetach) { window.__autoLogoutDetach(); delete window.__autoLogoutDetach; }
}
