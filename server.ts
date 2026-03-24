import express from "express";
import { createServer as createViteServer } from "vite";
import { google } from "googleapis";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------------------
// Google Sheets helpers
// ---------------------------------------------------------------------------

interface CredentialsResult {
  ok: boolean;
  sheetId: string;
  email: string;
  privateKey: string;
  error: string;
  details: string;
}

function validateCredentials(): CredentialsResult {
  const sheetId   = (process.env.VITE_SHEET_ID                    || "").trim();
  const email     = (process.env.VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL || "").trim();
  const rawKey    =  process.env.VITE_GOOGLE_PRIVATE_KEY           || "";

  const missing: string[] = [];
  if (!sheetId) missing.push("VITE_SHEET_ID");
  if (!email)   missing.push("VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL");
  if (!rawKey)  missing.push("VITE_GOOGLE_PRIVATE_KEY");

  const fail = (error: string, details: string): CredentialsResult =>
    ({ ok: false, sheetId: "", email: "", privateKey: "", error, details });

  if (missing.length > 0) {
    return fail("Missing environment variables", `Not set: ${missing.join(", ")}`);
  }

  if (!email.includes(".iam.gserviceaccount.com")) {
    return fail(
      "Invalid service account email",
      `'${email}' must end in .iam.gserviceaccount.com — regular Gmail addresses won't work.`,
    );
  }

  const privateKey = rawKey.replace(/\\n/g, "\n").replace(/"/g, "").trim();
  if (!privateKey.startsWith("-----BEGIN PRIVATE KEY-----")) {
    return fail(
      "Invalid private key format",
      "The key must start with '-----BEGIN PRIVATE KEY-----'. Copy the full key from the service-account JSON file.",
    );
  }

  return { ok: true, sheetId, email, privateKey, error: "", details: "" };
}

async function fetchSheetRows(
  sheetId: string,
  email: string,
  privateKey: string,
  sheetName: string,
): Promise<string[][]> {
  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  console.log(`[sheets] Fetching '${sheetName}' from sheet ${sheetId.slice(0, 8)}...`);

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${sheetName}!A1:AZ500`,
  });

  const rows = (response.data.values as string[][] | null | undefined) ?? [];
  console.log(`[sheets] Raw response: ${rows.length} rows (including header)`);
  return rows;
}

// Column name aliases — allows real sheet headers to vary from the exact names
// Keys are the canonical names (lowercase), values are accepted alternatives
const COLUMN_ALIASES: Record<string, string[]> = {
  "player name":  ["player", "name", "player_name", "playername"],
  "tier":         ["grade", "rank", "tier rank"],
  "book line":    ["line", "book_line", "bookline", "o/u", "over/under", "spread"],
  "ai proj":      ["ai projection", "projection", "predicted", "proj", "ai_proj", "aiproj", "model proj"],
  "edge":         ["advantage", "diff", "difference", "edge pts", "edge (pts)"],
  "confidence":   ["conf", "confidence %", "conf %", "conf%", "pct"],
  "g1":           ["game 1", "game1", "l1", "last 1"],
  "g2":           ["game 2", "game2", "l2", "last 2"],
  "g3":           ["game 3", "game3", "l3", "last 3"],
  "g4":           ["game 4", "game4", "l4", "last 4"],
  "g5":           ["game 5", "game5", "l5", "last 5"],
  "g6":           ["game 6", "game6", "l6", "last 6"],
  "g7":           ["game 7", "game7", "l7", "last 7"],
  "g8":           ["game 8", "game8", "l8", "last 8"],
  "g9":           ["game 9", "game9", "l9", "last 9"],
  "g10":          ["game 10", "game10", "l10", "last 10"],
};

function buildColumnIndex(headers: string[]): Record<string, number> {
  const normalized = headers.map((h) => (h ?? "").toLowerCase().trim());

  const findCol = (canonical: string): number => {
    // Exact match first
    const exact = normalized.indexOf(canonical.toLowerCase().trim());
    if (exact !== -1) return exact;

    // Try aliases
    const aliases = COLUMN_ALIASES[canonical.toLowerCase().trim()] ?? [];
    for (const alias of aliases) {
      const idx = normalized.indexOf(alias.toLowerCase().trim());
      if (idx !== -1) return idx;
    }

    return -1;
  };

  const idx: Record<string, number> = {
    playerName:  findCol("Player Name"),
    tier:        findCol("Tier"),
    bookLine:    findCol("Book Line"),
    aiProj:      findCol("AI Proj"),
    edge:        findCol("Edge"),
    confidence:  findCol("Confidence"),
    g1:          findCol("G1"),
    g2:          findCol("G2"),
    g3:          findCol("G3"),
    g4:          findCol("G4"),
    g5:          findCol("G5"),
    g6:          findCol("G6"),
    g7:          findCol("G7"),
    g8:          findCol("G8"),
    g9:          findCol("G9"),
    g10:         findCol("G10"),
  };

  console.log("[sheets] Column mapping:", JSON.stringify(idx));

  const missing = Object.entries(idx)
    .filter(([, v]) => v === -1)
    .map(([k]) => k);
  if (missing.length > 0) {
    console.warn("[sheets] Unmapped columns:", missing.join(", "));
    console.warn("[sheets] Actual headers:", JSON.stringify(headers));
  }

  return idx;
}

function parseNum(raw: any): number {
  if (raw === undefined || raw === null || raw === "") return 0;
  const val = parseFloat(String(raw).replace(/%/g, "").trim());
  return isNaN(val) ? 0 : val;
}

// ---------------------------------------------------------------------------
// Express server
// ---------------------------------------------------------------------------

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser(process.env.SESSION_SECRET || "default-secret"));

  // ── Health check ──────────────────────────────────────────────────────────
  app.get("/api/health", (_req, res) => {
    const creds = validateCredentials();
    res.json({
      status: "ok",
      config: {
        sheets: creds.ok,
        sheetsError: creds.ok ? null : creds.error,
        auth: !!process.env.GOOGLE_CLIENT_ID,
        session: !!process.env.SESSION_SECRET,
      },
    });
  });

  // ── Sheet diagnostics (raw data, no transformation) ───────────────────────
  app.get("/api/sheet-debug", async (req, res) => {
    const creds = validateCredentials();
    if (!creds.ok) {
      return res.status(500).json({ step: "credentials", error: creds.error, details: creds.details });
    }

    const sheetName = (req.query.sheet as string) || "MasterRanking";

    let rows: string[][];
    try {
      rows = await fetchSheetRows(creds.sheetId, creds.email, creds.privateKey, sheetName);
    } catch (err: any) {
      console.error("[sheet-debug] Fetch failed:", err.message);
      return res.status(500).json({
        step: "fetch",
        error: err.message,
        code: err.code,
        hint: err.code === 403
          ? "The service account doesn't have access to this sheet. Share the sheet with the service account email."
          : err.code === 404
          ? `Tab '${sheetName}' not found. Check the tab name (case-sensitive).`
          : "Check server logs for details.",
      });
    }

    if (!rows.length) {
      return res.json({ step: "empty", sheetName, message: "Sheet returned 0 rows." });
    }

    const headers = rows[0];
    const idx = buildColumnIndex(headers);

    const missingCritical = idx.playerName === -1;
    const sampleRows = rows.slice(1, 4).map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""])));

    res.json({
      step: "ok",
      sheetName,
      totalRows: rows.length - 1,
      headers,
      columnMapping: idx,
      missingCriticalColumn: missingCritical,
      sampleRows,
    });
  });

  // ── Player props ──────────────────────────────────────────────────────────
  app.get("/api/player-props", async (req, res) => {
    const creds = validateCredentials();
    if (!creds.ok) {
      console.error("[player-props] Credential error:", creds.error, creds.details);
      return res.status(500).json({ error: creds.error, details: creds.details });
    }

    const sheetName = (req.query.sheet as string) || "MasterRanking";

    let rows: string[][];
    try {
      rows = await fetchSheetRows(creds.sheetId, creds.email, creds.privateKey, sheetName);
    } catch (err: any) {
      console.error("[player-props] Sheets fetch error:", err.message, "code:", err.code);
      return res.status(500).json({
        error: "Failed to fetch data from Google Sheets",
        details: err.message,
        code: err.code,
        hint: err.code === 403
          ? `Share the sheet with: ${creds.email}`
          : err.code === 404
          ? `Tab '${sheetName}' not found. Check the tab name is exactly 'MasterRanking'.`
          : undefined,
      });
    }

    if (!rows.length) {
      console.warn("[player-props] Sheet returned 0 rows");
      return res.json({ data: [], lastUpdated: new Date().toISOString() });
    }

    const headers = rows[0];
    console.log("[player-props] Headers:", JSON.stringify(headers));

    const idx = buildColumnIndex(headers);

    if (idx.playerName === -1) {
      return res.status(500).json({
        error: "Column mapping failed",
        details: `'Player Name' column not found. Actual headers: [${headers.join(", ")}]`,
        hint: "Accepted names: 'Player Name', 'Player', 'Name'. Check sheet headers match one of these.",
      });
    }

    const TIER_ORDER: Record<string, number> = { S: 0, A: 1, B: 2, C: 3, D: 4 };

    const dataRows = rows.slice(1);
    const totalRows = dataRows.length;

    const data = dataRows
      .filter((row) => {
        const name = idx.playerName >= 0 ? (row[idx.playerName] || "").trim() : "";
        return name !== "";
      })
      .map((row, i) => {
        const playerName  = (row[idx.playerName] || "").trim();
        const tier        = (row[idx.tier]        || "C").trim().toUpperCase();
        const bookLine    = parseNum(row[idx.bookLine]);
        const aiProj      = parseNum(row[idx.aiProj]) || bookLine;
        const edge        = parseNum(row[idx.edge]);
        const confidence  = parseNum(row[idx.confidence]);

        const g = (n: number) => parseNum(row[n]);
        const g1 = g(idx.g1), g2 = g(idx.g2), g3 = g(idx.g3), g4 = g(idx.g4), g5 = g(idx.g5);
        const g6 = g(idx.g6), g7 = g(idx.g7), g8 = g(idx.g8), g9 = g(idx.g9), g10 = g(idx.g10);

        const playerInitials = playerName
          .split(" ")
          .map((n: string) => n[0] || "")
          .join("")
          .toUpperCase()
          .slice(0, 2);

        return {
          // Core PlayerProp fields
          id:               encodeURIComponent(`${playerName}-${i}`),
          player:           playerName,
          playType:         "OVER" as const,
          line:             bookLine,
          projectedPts:     aiProj,
          diff:             edge,
          tier,
          score:            0,
          team:             "",
          opponent:         "",
          hitRateL10:       0,
          hitRateDisplay:   "N/A",
          confidence,
          confidenceDisplay: `${Math.round(confidence)}%`,
          algoRecord:       "",
          modelRecord:      "",
          lastResult:       "",
          algoModelBlend:   0,
          tierRank:         TIER_ORDER[tier] ?? 99,
          last10Games:      [g1, g2, g3, g4, g5, g6, g7, g8, g9, g10],
          edgeDisplay:      `${edge >= 0 ? "+" : ""}${edge.toFixed(1)} pts`,
          valueLabel:       tier === "S" || tier === "A" ? "High Value" : tier === "B" ? "Medium Value" : "Low Edge",
          isHighValue:      (tier === "S" || tier === "A") && confidence >= 60,

          // Display / PropCard fields
          playerName,
          playerInitials,
          bookLine,
          aiProj,
          edge,
          g1, g2, g3, g4, g5, g6, g7, g8, g9, g10,
          projection: aiProj,
          matchup:    "",
          propType:   "pts",
        };
      })
      .sort((a, b) => {
        const ta = TIER_ORDER[a.tier] ?? 99;
        const tb = TIER_ORDER[b.tier] ?? 99;
        if (ta !== tb) return ta - tb;
        return b.edge - a.edge;
      });

    console.log(`[player-props] ${totalRows} raw rows → ${data.length} mapped. First: ${data[0]?.playerName ?? "none"}`);
    console.log(`[player-props] Sending HTTP 200 — ${data.length} props`);

    res.json({ data, lastUpdated: new Date().toISOString() });
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

  app.get("/api/auth/google/callback", async (req, res) => {
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
    console.log(`[server] Running on http://localhost:${PORT}`);
    const creds = validateCredentials();
    if (creds.ok) {
      console.log(`[server] Google Sheets: configured ✓ (sheet ${creds.sheetId.slice(0, 8)}...)`);
    } else {
      console.warn(`[server] Google Sheets: NOT configured — ${creds.error}`);
    }
  });
}

startServer();
