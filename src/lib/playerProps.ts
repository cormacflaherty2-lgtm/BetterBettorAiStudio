/**
 * Shared mapper: converts a raw Supabase AppData row into a PlayerProp
 * object that all frontend components and hooks expect.
 *
 * Column mapping (AppData → PlayerProp):
 *   player_name      → player, playerName
 *   play_type        → playType ("OVER" | "UNDER")
 *   line             → line, bookLine
 *   avg_line         → avgLine
 *   tier             → tier (uppercased), tierRank
 *   team             → team
 *   oppent           → opponent  (typo in Supabase column name)
 *   confidence       → confidence (if > 1 use as-is, if ≤ 1 multiply by 100)
 *   prob_hit         → probHit (decimal × 100 → 0-100)
 *   new_algo_dif     → newAlgoDif (string like "65%")
 *   new_algo_diff_num→ newAlgoDiffNum (number like 6.2)
 *   proj_points      → projectedPts, aiProj, projection, projPoints
 *   rolling_avg      → rollingAvg
 *   score            → score, algoModelBlend
 *   edge             → edge, diff
 *   hit_miss         → hitMiss, lastResult
 *   bias             → biasScore
 *   agree            → agree
 */
import { PlayerProp } from '../types';

const TIER_ORDER: Record<string, number> = { S: 0, A: 1, B: 2, C: 3, D: 4 };

/**
 * Generates deterministic mock game logs for a player.
 * Same player + line always produces the same 10 values.
 * Swap this out for real per-game Supabase columns when available.
 */
export function generateMockGameLogs(playerName: string, line: number): number[] {
  let seed = playerName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) + Math.round(line * 10);
  const results: number[] = [];
  for (let i = 0; i < 10; i++) {
    seed = (seed * 9301 + 49297) % 233280;
    const rand = seed / 233280;
    const variance = Math.max(line * 0.4, 4);
    const raw = line + (rand * 2 - 1) * variance;
    results.push(Math.round(Math.max(0, raw) * 2) / 2); // round to nearest 0.5
  }
  return results;
}

export function mapSupabaseRow(row: any, index: number): PlayerProp {
  const playerName  = (row.player_name || '').trim();
  const tier        = (row.tier || 'C').toUpperCase();

  const rawConf     = Number(row.confidence ?? 0);
  const confidence  = rawConf > 1 ? Math.round(rawConf) : Math.round(rawConf * 100);

  const rawProbHit  = Number(row.prob_hit ?? 0);
  const probHit     = rawProbHit > 1 ? Math.round(rawProbHit) : Math.round(rawProbHit * 100);
  const projPoints  = Number(row.proj_points ?? 0);
  const line        = Number(row.line ?? 0);
  const avgLine     = Number(row.avg_line ?? 0);
  const edge        = Number(row.edge ?? 0);
  const score       = Number(row.score ?? 0);
  const rollingAvg  = Number(row.rolling_avg ?? 0);
  const newAlgoDiffNum = Number(row.new_algo_diff_num ?? 0);
  const newAlgoDif  = String(row.new_algo_dif ?? '');
  const hitMiss     = String(row.hit_miss ?? '');
  const agree       = Number(row.agree ?? 0);

  const playType: 'OVER' | 'UNDER' =
    (row.play_type || '').toUpperCase() === 'UNDER' ? 'UNDER' : 'OVER';

  const playerInitials = playerName
    .split(' ')
    .map((n: string) => n[0] || '')
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const hitRateL10 = probHit; // best approximation from available data

  return {
    // identity
    id: encodeURIComponent(`${playerName}-${index}`),

    // core PlayerProp fields
    player:           playerName,
    playType,
    line,
    projectedPts:     projPoints,
    diff:             edge,
    tier,
    score,
    team:             row.team    || '',
    opponent:         row.oppent  || '',  // note the typo in Supabase column
    hitRateL10,
    hitRateDisplay:   `${hitRateL10}%`,
    confidence,
    confidenceDisplay: `${confidence}%`,
    algoRecord:       '',
    modelRecord:      '',
    lastResult:       hitMiss,
    algoModelBlend:   score,
    biasScore:        Number(row.bias ?? 0),
    tierRank:         TIER_ORDER[tier] ?? 99,
    last10Games:      generateMockGameLogs(playerName, line),
    edgeDisplay:      `${edge >= 0 ? '+' : ''}${edge.toFixed(1)} pts`,
    valueLabel:       tier === 'S' || tier === 'A' ? 'High Value'
                      : tier === 'B' ? 'Medium Value' : 'Low Edge',
    isHighValue:      (tier === 'S' || tier === 'A') && confidence >= 60,

    // display / PropCard fields
    playerName,
    playerInitials,
    bookLine:         line,
    aiProj:           projPoints,
    edge,
    g1: 0, g2: 0, g3: 0, g4: 0, g5: 0,
    g6: 0, g7: 0, g8: 0, g9: 0, g10: 0,
    projection:       projPoints,
    matchup:          `${row.team || ''} vs ${row.oppent || ''}`,
    propType:         'POINTS',
    category:         undefined,

    // AppData schema fields
    projPoints,
    probHit,
    newAlgoDif,
    newAlgoDiffNum,
    rollingAvg,
    hitMiss,
    avgLine,
    agree,
  };
}
