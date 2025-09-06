import express from "express";
import { execFile } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";

const app = express();
app.use(express.json({ limit: "1mb" }));

// Trust proxy headers (required for Render's load balancer)
app.set("trust proxy", 1);

// --- Health check (no auth required) ---
app.get("/", (_, res) => res.status(200).send("ok"));

// --- Security: simple token auth via x-auth-token ---
app.use((req, res, next) => {
  // Skip auth for health check
  if (req.path === "/" && req.method === "GET") {
    return next();
  }
  
  const token = req.headers["x-auth-token"];
  if (!token || token !== process.env.AUTH_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

// --- Basic rate limiting (protect your quota) ---
import rateLimit from "express-rate-limit";
app.use(
  rateLimit({
    windowMs: 60 * 1000,     // 1 minute window
    max: 20,                 // 20 requests per minute per IP
    standardHeaders: true,
    legacyHeaders: false
  })
);


// --- Headless runner ---
app.post("/run", (req, res) => {
  const { prompt, cwd = "/workspace", timeoutMs = 180000 } = req.body || {};
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Missing prompt" });
  }

  // Ensure /workspace (persistent disk) exists
  if (!existsSync(cwd)) {
    try { mkdirSync(cwd, { recursive: true }); } catch {}
  }

  // Build args for Claude Code
  // Use -p flag for non-interactive mode
  const args = ["-p", prompt];

  // Execute `claude` (installed globally in PATH)
  // Set cwd as the working directory for the command
  execFile("claude", args, { timeout: timeoutMs, cwd: cwd }, (err, stdout, stderr) => {
    if (err) {
      return res.status(500).json({
        error: err.message,
        stderr: (stderr || "").slice(0, 10_000)
      });
    }
    // Try to return JSON; fall back to raw text
    try {
      return res.json(JSON.parse(stdout));
    } catch {
      return res.type("text/plain").send(stdout);
    }
  });
});

// --- Graceful shutdown ---
const server = app.listen(8080, () => {
  console.log("Claude Code API listening on :8080");
});
process.on("SIGTERM", () => server.close(() => process.exit(0)));
process.on("SIGINT", () => server.close(() => process.exit(0)));