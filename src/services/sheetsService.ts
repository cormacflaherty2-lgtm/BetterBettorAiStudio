const SHEET_ID = import.meta.env.VITE_SHEET_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;
const RANGE = 'MasterRanking!A:AV';

export interface PlayerProp {
  id: string;
  player: string;
  playType: string;
  line: number;
  projectedPts: number;
  diff: number;
  edgeDisplay: string;
  tier: string;
  team: string;
  opponent: string;
  confidence: number;
  hitRateL10: number;
  algoRecord: string;
  modelRecord: string;
  last10Games: number[];
  lastResult: string;
  // Compatibility fields for UI
  playerName?: string;
  playerInitials?: string;
  matchup?: string;
  category?: string;
  projection?: number;
  edge?: number;
  propType?: string;
}

function parseNum(val: string | undefined): number {
  const n = parseFloat(val ?? '');
  return isNaN(n) ? 0 : n;
}

function parseHitRate(val: string | undefined): number {
  const n = parseNum(val);
  return n > 1 ? n : n * 100;
}

function mapRow(row: string[], index: number): PlayerProp | null {
  const player = row[6]?.trim();
  if (!player) return null;

  const line = parseNum(row[8]);
  const projectedPts = parseNum(row[9]);
  const diff = projectedPts - line;
  const team = row[12]?.trim() ?? '';
  const opponent = row[13]?.trim() ?? '';

  return {
    id: `${player}-${index}`,
    player,
    playType: row[7]?.trim() ?? 'OVER',
    line,
    projectedPts,
    diff,
    edgeDisplay: `${diff >= 0 ? '+' : ''}${diff.toFixed(1)} pts`,
    tier: row[10]?.trim() ?? '',
    team,
    opponent,
    hitRateL10: parseHitRate(row[14]),
    confidence: parseNum(row[23]),
    algoRecord: row[0]?.trim() ?? '',
    modelRecord: row[2]?.trim() ?? '',
    lastResult: row[5]?.trim() ?? '',
    last10Games: Array.from({ length: 10 }, (_, i) => parseNum(row[37 + i])),
    // Compatibility fields
    playerName: player,
    playerInitials: player.split(' ').map(n => n[0]).join(''),
    matchup: `${team} vs ${opponent}`,
    category: "Points",
    projection: projectedPts,
    edge: diff,
    propType: "PTS"
  };
}

export async function fetchPlayerProps(): Promise<PlayerProp[]> {
  if (!SHEET_ID || !API_KEY) {
    console.error('❌ Missing VITE_SHEET_ID or VITE_GOOGLE_SHEETS_API_KEY in .env');
    return [];
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}&t=${Date.now()}`;

  try {
    const res = await fetch(url, { cache: 'no-store' });

    if (!res.ok) {
      const err = await res.json();
      console.error('❌ Sheets API error:', err.error?.status, err.error?.message);
      return [];
    }

    const json = await res.json();
    const rows: string[][] = json.values ?? [];

    if (rows.length < 2) {
      console.error('❌ Sheet returned no player rows');
      return [];
    }

    const players = rows
      .slice(1)                          // skip header row
      .map((row, i) => mapRow(row, i))
      .filter((p): p is PlayerProp => p !== null);

    console.log(`✅ Loaded ${players.length} players from sheet`);
    return players;

  } catch (err) {
    console.error('❌ Fetch failed:', err);
    return [];
  }
}
