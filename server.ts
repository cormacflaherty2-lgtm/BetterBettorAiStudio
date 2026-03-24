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
    const requestedSheet = req.query.sheet as string || "MasterRanking";

    if (!sheetId || !email || !privateKey) {
      return res.status(500).json({ 
        error: "Developer credentials not configured",
        details: `Missing: ${!sheetId ? 'VITE_SHEET_ID ' : ''}${!email ? 'VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL ' : ''}${!privateKey ? 'VITE_GOOGLE_PRIVATE_KEY' : ''}`
      });
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail.includes(".iam.gserviceaccount.com")) {
      return res.status(400).json({
        error: "Invalid Service Account Email",
        details: "The email must be a Google Service Account email ending in '.iam.gserviceaccount.com'. Regular Gmail addresses will not work."
      });
    }

    const cleanedKey = privateKey.replace(/\\n/g, '\n').replace(/"/g, '').trim();
    if (!cleanedKey.startsWith("-----BEGIN PRIVATE KEY-----")) {
      return res.status(400).json({
        error: "Invalid Private Key Format",
        details: "The private key must start with '-----BEGIN PRIVATE KEY-----'. Ensure you copied the entire key from the JSON file."
      });
    }

    try {
      const auth = new google.auth.JWT({
        email: trimmedEmail,
        key: cleanedKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
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
      
      // Map columns by their exact header name
      const getColIndex = (name: string) => headers.indexOf(name);
      
      const idx = {
        algoRecord: getColIndex("AlgO"),
        modelRecord: getColIndex("ModelO"),
        lastResult: getColIndex("Hit/Miss"),
        player: getColIndex("Player"),
        playType: getColIndex("Play Type"),
        line: getColIndex("Line"),
        projectedPts: getColIndex("AvgLine"),
        tier: getColIndex("Tier"),
        score: getColIndex("Score"),
        team: getColIndex("Team"),
        opponent: getColIndex("Opponent"),
        hitRateL10: getColIndex("L10 HR%"),
        biasScore: getColIndex("BiasScore"),
        confidence: getColIndex("Confidence"),
        algoModelBlend: getColIndex("Algo-Model Blend"),
        tierRank: getColIndex("TierRank"),
        allAgree: getColIndex("All Agree"),
        nAlgoDiff: getColIndex("NAlgo %D"),
        oAlgoDiff: getColIndex("OAlgo %D"),
      };

      function parseHitRate(raw: any): number {
        const val = parseFloat(String(raw));
        if (isNaN(val)) return 0;
        // If the value is already > 1, it was sent as a whole percent (e.g. 70 means 70%)
        // If the value is <= 1, it is a decimal that needs multiplying (e.g. 0.7 means 70%)
        return val > 1 ? val : val * 100;
      }

      function parsePercentString(raw: any): number {
        if (!raw) return 0;
        const cleaned = String(raw).replace(/%/g, '').trim();
        const val = parseFloat(cleaned);
        return isNaN(val) ? 0 : val;
      }

      // Audit Logging
      console.log("--- Numeric Audit ---");
      const auditRows = rows.slice(1, 4);
      auditRows.forEach((row, i) => {
        console.log(`Row ${i + 1}:`);
        console.log(`  L10 HR%: raw="${row[idx.hitRateL10]}", converted=${parseHitRate(row[idx.hitRateL10])}`);
        console.log(`  Confidence: raw="${row[idx.confidence]}", converted=${parseFloat(row[idx.confidence])}`);
        console.log(`  Score: raw="${row[idx.score]}", converted=${parseFloat(row[idx.score])}`);
        console.log(`  Algo-Model Blend: raw="${row[idx.algoModelBlend]}", converted=${parseFloat(row[idx.algoModelBlend])}`);
        console.log(`  Line: raw="${row[idx.line]}", converted=${parseFloat(row[idx.line])}`);
        console.log(`  AvgLine: raw="${row[idx.projectedPts]}", converted=${row[idx.projectedPts] ? parseFloat(row[idx.projectedPts]) : 'blank'}`);
      });
      
      const dataRows = rows.slice(1);

      const data = dataRows
        .filter(row => {
          const player = row[idx.player];
          const line = parseFloat(row[idx.line]);
          return player && player.trim() !== "" && !isNaN(line) && line !== 0;
        })
        .map((row, rowIndex) => {
          const player = row[idx.player] || "";
          const line = parseFloat(row[idx.line]) || 0;
          const rawAvgLine = row[idx.projectedPts];
          const projectedPts = (rawAvgLine && rawAvgLine.trim() !== "") ? parseFloat(rawAvgLine) : line;
          
          const rawScore = row[idx.score];
          const score = isNaN(parseFloat(rawScore)) ? 0 : parseFloat(rawScore);
          
          const hitRateL10 = parseHitRate(row[idx.hitRateL10]);
          const confidence = parseFloat(row[idx.confidence]) || 0;
          const tier = row[idx.tier] || "C";
          
          const diff = projectedPts - line;

          // Extract last 10 games from columns 37-46 (index 36-45)
          const last10Games = [];
          for (let i = 36; i <= 45; i++) {
            const val = parseFloat(row[i]);
            last10Games.push(isNaN(val) ? 0 : val);
          }

          const playerInitials = player.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
          const matchup = `${row[idx.team] || ""} vs ${row[idx.opponent] || ""}`;

          const mapped = {
            id: encodeURIComponent(`${player}-${rowIndex}`),
            player,
            playerName: player,
            playerInitials,
            team: row[idx.team] || "",
            opponent: row[idx.opponent] || "",
            line,
            playType: (row[idx.playType] || "OVER").toUpperCase(),
            propType: "PTS", // Default or map from playType if possible, but frontend expects propType
            projectedPts,
            projection: projectedPts,
            diff,
            edge: diff,
            matchup,
            tier,
            score,
            hitRateL10,
            confidence,
            algoRecord: row[idx.algoRecord] || "0 - 0",
            modelRecord: row[idx.modelRecord] || "0 - 0",
            lastResult: row[idx.lastResult] || "",
            algoModelBlend: isNaN(parseFloat(row[idx.algoModelBlend])) ? 0 : parseFloat(row[idx.algoModelBlend]),
            tierRank: parseInt(row[idx.tierRank]) || 0,
            biasScore: parseFloat(row[idx.biasScore]) || 0,
            allAgree: parseHitRate(row[idx.allAgree]),
            nAlgoDiff: parsePercentString(row[idx.nAlgoDiff]),
            oAlgoDiff: parsePercentString(row[idx.oAlgoDiff]),
            last10Games,
            
            // Derived values computed here for the API response
            hitRateDisplay: `${hitRateL10.toFixed(0)}%`,
            confidenceDisplay: `${Math.round(confidence)}%`,
            edgeDisplay: `${diff >= 0 ? "+" : ""}${diff.toFixed(1)} pts`,
            valueLabel: score >= 40 ? "High Value" : score >= 20 ? "Medium Value" : "Low Edge",
            isHighValue: (tier === "S" || tier === "A") && confidence >= 60,
          };

          if (player.includes("Marcus Smart")) {
            console.log("Marcus Smart Mapped Object:", JSON.stringify(mapped, null, 2));
          }

          return mapped;
        });

      console.log("First 3 Mapped PlayerProp Objects:", JSON.stringify(data.slice(0, 3), null, 2));
      res.json({ data, lastUpdated: new Date().toISOString() });
    } catch (error: any) {
      console.error("Error fetching player props from master sheet:", error);
      res.status(500).json({ 
        error: "Failed to fetch data from Google Sheets", 
        details: error.message,
        code: error.code
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
