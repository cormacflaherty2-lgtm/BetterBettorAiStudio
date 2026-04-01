import express from "express";
import { createServer as createViteServer } from "vite";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser(process.env.SESSION_SECRET || "default-secret"));

  // ── Health check ──────────────────────────────────────────────────────────
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      config: {
        supabase: !!(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY),
        auth: !!process.env.GOOGLE_CLIENT_ID,
        session: !!process.env.SESSION_SECRET,
      },
    });
  });

  // ── Google OAuth skeleton ─────────────────────────────────────────────────
  app.get("/api/auth/google/url", (req, res) => {
    const clientId    = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    if (!clientId || !redirectUri) {
      return res.status(500).json({ error: "OAuth credentials not configured" });
    }
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=email%20profile`;
    res.json({ url });
  });

  app.get("/api/auth/google/callback", async (_req, res) => {
    if (!process.env.GOOGLE_CLIENT_SECRET) {
      return res.status(500).send("Server configuration error: Missing Client Secret");
    }
    res.send("OAuth Callback received. Ready for token exchange implementation.");
  });

  // ── Vite / static serving ─────────────────────────────────────────────────
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    const supabaseConfigured = !!(
      process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY
    );
    console.log(`[server] Running on http://localhost:${PORT}`);
    console.log(
      `[server] Supabase: ${supabaseConfigured ? "configured ✓" : "NOT configured — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"}`
    );
  });
}

startServer();
