import type { VercelRequest, VercelResponse } from "@vercel/node";
import { google } from "googleapis";

const TIER_ORDER: Record<string, number> = { S: 0, A: 1, B: 2, C: 3, D: 4 };

function parseNum(raw: any): number {
  if (raw === undefined || raw === null || raw === "") return 0;
  const val = parseFloat(String(raw).replace(/%/g, "").trim());
  return isNaN(val) ? 0 : val;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
      details: "The email must be a Google Service Account email ending in '.iam.gserviceaccount.com'.",
    });
  }

  const cleanedKey = privateKey.replace(/\\n/g, "\n").replace(/"/g, "").trim();
  if (!cleanedKey.startsWith("-----BEGIN PRIVATE KEY-----")) {
    return res.status(400).json({
      error: "Invalid Private Key Format",
      details: "The private key must start with '-----BEGIN PRIVATE KEY-----'.",
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
    console.log("[player-props] Sheet headers:", JSON.stringify(headers));

    // Case-insensitive, trim-tolerant column lookup
    const col = (name: string) => {
      const target = name.toLowerCase().trim();
      return headers.findIndex((h: string) => h?.toLowerCase().trim() === target);
    };

    // Column indices — mapped to MasterRanking header names
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

    console.log("[player-props] Column indices:", JSON.stringify(idx));

    if (idx.playerName === -1) {
      console.error("[player-props] Column 'Player Name' not found. Headers:", headers);
      return res.status(500).json({
        error: "Column mapping failed",
        details: `'Player Name' column not found in sheet. Headers found: ${headers.join(", ")}`,
      });
    }

    const totalRows = rows.length - 1;

    const data = rows
      .slice(1)
      .filter((row) => {
        const playerName = idx.playerName >= 0 ? row[idx.playerName] : undefined;
        return playerName && playerName.trim() !== "";
      })
      .map((row, rowIndex) => {
        const playerName = (row[idx.playerName] || "").trim();
        const tier = (row[idx.tier] || "C").trim().toUpperCase();
        const bookLine = parseNum(row[idx.bookLine]);
        const aiProj = parseNum(row[idx.aiProj]) || bookLine;
        const edge = parseNum(row[idx.edge]);
        const confidence = parseNum(row[idx.confidence]);

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
          hitRateL10: 0,
          hitRateDisplay: "N/A",
          confidence,
          confidenceDisplay: `${Math.round(confidence)}%`,
          algoRecord: "",
          modelRecord: "",
          lastResult: "",
          algoModelBlend: 0,
          tierRank: TIER_ORDER[tier] ?? 99,
          last10Games: [g1, g2, g3, g4, g5, g6, g7, g8, g9, g10],
          edgeDisplay: `${edge >= 0 ? "+" : ""}${edge.toFixed(1)} pts`,
          valueLabel: tier === "S" || tier === "A" ? "High Value" : tier === "B" ? "Medium Value" : "Low Edge",
          isHighValue: (tier === "S" || tier === "A") && confidence >= 60,

          // MasterRanking schema fields
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

    console.log(`[player-props] Total rows: ${totalRows}, after filter: ${data.length}`);
    console.log(`[player-props] Loaded ${data.length} players. First player:`, JSON.stringify(data[0], null, 2));

    res.json({ data, lastUpdated: new Date().toISOString() });
  } catch (error: any) {
    console.error("Error fetching player props from Google Sheets:", error);
    res.status(500).json({
      error: "Failed to fetch data from Google Sheets",
      details: error.message,
      code: error.code,
    });
  }
}
