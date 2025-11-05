// server/index.cjs
process.on("unhandledRejection", (err) => { console.error("UnhandledRejection:", err); process.exit(1); });
process.on("uncaughtException", (err) => { console.error("UncaughtException:", err); process.exit(1); });

const express = require("express");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const appNext = next({ dev });
const handle = appNext.getRequestHandler();

console.log("[BOOT] Starting server. NODE_ENV=%s", process.env.NODE_ENV);

appNext.prepare().then(() => {
  console.log("[BOOT] Next prepared. Mounting Express...");
  const app = express();
  app.use(express.json());

  app.use((req, _res, next) => {
    console.log("[%s] %s %s", new Date().toISOString(), req.method, req.originalUrl);
    next();
  });

  app.use("/api/auth", require("./routes/auth.cjs"));
  app.use("/api/users", require("./routes/users.cjs"));
  app.use("/api/export", require("./routes/export.cjs"));

  app.get("/api/health", (_req, res) => res.json({ ok: true, name: "loyalty-ui", time: Date.now() }));

  app.use("/api", (req, res, next) => {
    if (res.headersSent) return next();
    res.status(404).json({ error: "NOT_FOUND", path: req.originalUrl });
  });

  app.all("*", (req, res) => handle(req, res));

  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log("[BOOT] Server started on %s", port));
}).catch((e) => {
  console.error("[BOOT] Next prepare failed:", e);
  process.exit(1);
});
