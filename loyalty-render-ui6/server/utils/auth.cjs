const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.replace("Bearer ","").trim();
  if (!token) return res.status(401).json({ error: "UNAUTHORIZED" });
  try { req.user = jwt.verify(token, process.env.JWT_SECRET || "devsecret"); next(); }
  catch { res.status(401).json({ error: "INVALID_TOKEN" }); }
}
function requireRole(roles) {
  const order = ["staff","manager","admin"];
  const need = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    const r = req.user?.role;
    if (!r) return res.status(403).json({ error: "FORBIDDEN" });
    const ok = need.some(x => order.indexOf(x) <= order.indexOf(r));
    if (!ok) return res.status(403).json({ error: "FORBIDDEN" });
    next();
  };
}
module.exports = { authMiddleware, requireRole };
