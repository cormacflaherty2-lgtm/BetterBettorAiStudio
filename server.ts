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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser(process.env.SESSION_SECRET || "default-secret"));

  // --- API Routes ---

  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok",
      config: {
        sheets: !!process.env.VITE_SHEET_ID,
        auth: !!process.env.GOOGLE_CLIENT_ID,
        session: !!process.env.SESSION_SECRET
      }
    });
  });

  // --- Google OAuth Flow (Skeleton) ---
  app.get("/api/auth/google/url", (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      return res.status(500).json({ error: "OAuth credentials not configured" });
    }

    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=email%20profile`;
    res.json({ url });
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    const { code } = req.query;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    if (!clientSecret) {
      return res.status(500).send("Server configuration error: Missing Client Secret");
    }

    // This is where you would exchange the code for tokens
    res.send("OAuth Callback received. Ready for token exchange implementation.");
  });

  // --- Developer Data Pipeline (Google Sheets) ---

  app.get("/api/player-props", async (req, res) => {
    const sheetId = process.env.VITE_SHEET_ID;
    const email = process.env.VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.VITE_GOOGLE_PRIVATE_KEY;
    const requestedSheet = (req.query.sheet as string) || "MasterRanking";

    if (!sheetId || !email || !privateKey) {
      return res.status(500).json({
        error: "Developer credentials not configured",
        details: `Missing: ${!sheetId ? "VITE_SHEET_ID " : ""}${!email ? "VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL " : ""}${!privateKey ? "VITE_GOOGLE_PRIVATE_KEY" : ""}`,
      });
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail.includes(".iam.gserviceaccount.com")) {
      return res.status(400).json({
        error: "Invalid Service Account Email",
        details: "The email must be a Google Service Account email ending in '.iam.gserviceaccount.com'. Regular Gmail addresses will not work.",
      });
    }

    const cleanedKey = privateKey.replace(/\\n/g, "\n").replace(/"/g, "").trim();
    if (!cleanedKey.startsWith("-----BEGIN PRIVATE KEY-----")) {
      return res.status(400).json({
        error: "Invalid Private Key Format",
        details: "The private key must start with '-----BEGIN PRIVATE KEY-----'. Ensure you copied the entire key from the JSON file.",
      });
    }

    try {
      const auth = new google.auth.JWT({
        email: trimmedEmail,
        key: cleanedKey,
        scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
      });

      const sheets = google.sheets({ version: "v4", auth });
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `${requestedSheet}!A1:AZ500`,
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        return res.json({ data: [], lastUpdated: new Date().toISOString() });
      }

      const headers = rows[0];
      // Case-insensitive, whitespace-tolerant header lookup
      const col = (name: string) => {
        const lower = name.toLowerCase().trim();
        return headers.findIndex((h: string) => (h ?? "").toLowerCase().trim() === lower);
      };

      // Column indices — mapped to exact MasterRanking header names
      const idx = {
        playerName: col("Player Name"),
        tier:       col("Tier"),
        bookLine:   col("Book Line"),
        aiProj:     col("AI Proj"),
        edge:       col("Edge"),
        confidence: col("Confidence"),
        g1:         col("G1"),
        g2:         col("G2"),
        g3:         col("G3"),
        g4:         col("G4"),
        g5:         col("G5"),
        g6:         col("G6"),
        g7:         col("G7"),
        g8:         col("G8"),
        g9:         col("G9"),
        g10:        col("G10"),
      };

      function parseNum(raw: any): number {
        if (raw === undefined || raw === null || raw === "") return 0;
        const val = parseFloat(String(raw).replace(/%/g, "").trim());
        return isNaN(val) ? 0 : val;
      }

      console.log(`[player-props] Sheet headers:`, headers);
      console.log(`[player-props] Column indices:`, idx);

      const TIER_ORDER: Record<string, number> = { S: 0, A: 1, B: 2, C: 3, D: 4 };

      const data = rows
        .slice(1)
        .filter((row) => {
          const playerName = row[idx.playerName];
          const bookLine = parseNum(row[idx.bookLine]);
          return playerName && playerName.trim() !== "" && bookLine !== 0;
        })
        .map((row, rowIndex) => {
          const playerName = (row[idx.playerName] || "").trim();
          const tier = ((row[idx.tier] || "C").trim().toUpperCase());
          const bookLine = parseNum(row[idx.bookLine]);
          const aiProj = parseNum(row[idx.aiProj]) || bookLine;
          const edge = parseNum(row[idx.edge]);

          const g1  = parseNum(row[idx.g1]);
          const g2  = parseNum(row[idx.g2]);
          const g3  = parseNum(row[idx.g3]);
          const g4  = parseNum(row[idx.g4]);
          const g5  = parseNum(row[idx.g5]);
          const g6  = parseNum(row[idx.g6]);
          const g7  = parseNum(row[idx.g7]);
          const g8  = parseNum(row[idx.g8]);
          const g9  = parseNum(row[idx.g9]);
          const g10 = parseNum(row[idx.g10]);

          // Compute hit rate: games where player exceeded the book line
          const last10Games = [g1, g2, g3, g4, g5, g6, g7, g8, g9, g10];
          const gamesWithData = last10Games.filter(v => v > 0);
          const hitsOverLine = gamesWithData.filter(v => v >= bookLine).length;
          const hitRateL10 = gamesWithData.length > 0
            ? Math.round((hitsOverLine / gamesWithData.length) * 100)
            : 0;

          // Normalize confidence: some sheets store 0-1 decimals, others 0-100
          const rawConf = parseNum(row[idx.confidence]);
          const confidenceNorm = rawConf > 0 && rawConf <= 1 ? Math.round(rawConf * 100) : Math.round(rawConf);

          const playerInitials = playerName
            .split(" ")
            .map((n: string) => n[0] || "")
            .join("")
            .toUpperCase()
            .slice(0, 2);

          return {
            // PlayerProp required fields
            id: encodeURIComponent(`${playerName}-${rowIndex}`),
            player: playerName,
            playType: "OVER" as const,
            line: bookLine,
            projectedPts: aiProj,
            diff: edge,
            tier,
            score: 0,
            team: "",
            opponent: "",
            hitRateL10,
            hitRateDisplay: gamesWithData.length > 0 ? `${hitRateL10}%` : "N/A",
            confidence: confidenceNorm,
            confidenceDisplay: `${confidenceNorm}%`,
            algoRecord: "",
            modelRecord: "",
            lastResult: "",
            algoModelBlend: 0,
            tierRank: TIER_ORDER[tier] ?? 99,
            last10Games: [g1, g2, g3, g4, g5, g6, g7, g8, g9, g10],
            edgeDisplay: `${edge >= 0 ? "+" : ""}${edge.toFixed(1)} pts`,
            valueLabel: tier === "S" || tier === "A" ? "High Value" : tier === "B" ? "Medium Value" : "Low Edge",
            isHighValue: (tier === "S" || tier === "A") && confidenceNorm >= 60,

            // New schema fields
            playerName,
            playerInitials,
            bookLine,
            aiProj,
            edge,
            g1, g2, g3, g4, g5, g6, g7, g8, g9, g10,

            // PropCard display fields
            projection: aiProj,
            matchup: "",
            propType: "pts",
          };
        })
        .sort((a, b) => {
          const tierA = TIER_ORDER[a.tier] ?? 99;
          const tierB = TIER_ORDER[b.tier] ?? 99;
          if (tierA !== tierB) return tierA - tierB;
          return b.edge - a.edge;
        });

      console.log(`[player-props] Loaded ${data.length} players. First player:`, JSON.stringify(data[0], null, 2));

      res.json({ data, lastUpdated: new Date().toISOString() });
    } catch (error: any) {
      console.error("Error fetching player props from master sheet:", error);
      res.status(500).json({
        error: "Failed to fetch data from Google Sheets",
        details: error.message,
        code: error.code,
      });
    }
  });

  // --- Vite Integration ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
