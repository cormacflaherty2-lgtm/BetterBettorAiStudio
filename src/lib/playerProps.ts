/**
 * Shared mapper: converts a raw Supabase player_props row into a PlayerProp
 * object that all frontend components and hooks expect.
 *
 * Column mapping (Supabase → PlayerProp):
 *   player_name  → player, playerName
 *   tier         → tier (uppercased), tierRank
 *   team         → team
 *   opponent     → opponent
 *   book_line    → line, bookLine
 *   ai_proj      → projectedPts, aiProj, projection
 *   edge         → diff, edge, edgeDisplay
 *   confidence   → confidence (decimal ×100 → 0-100 integer)
 *   bias_score   → biasScore
 *   blend_score  → score, algoModelBlend
 *   over_under   → playType ("OVER" | "UNDER")
 *   hit_rate_l10 → hitRateL10 (decimal ×100), hitRateDisplay
 *   algo_record  → algoRecord
 *   model_record → modelRecord
 *   g1–g10       → g1–g10, last10Games[]
 */
import { PlayerProp } from '../types';

const TIER_ORDER: Record<string, number> = { S: 0, A: 1, B: 2, C: 3, D: 4 };

export function mapSupabaseRow(row: any, index: number): PlayerProp {
  const playerName  = (row.player_name || '').trim();
  const tier        = (row.tier || 'C').toUpperCase();
  const confidence  = Math.round((row.confidence   ?? 0) * 100); // 0.665 → 67
  const hitRateL10  = Math.round((row.hit_rate_l10 ?? 0) * 100); // 0.7 → 70
  const edge        = Number(row.edge       ?? 0);
  const aiProj      = Number(row.ai_proj    ?? 0);
  const bookLine    = Number(row.book_line  ?? 0);
  const blendScore  = Number(row.blend_score ?? 0);
  const playType: 'OVER' | 'UNDER' =
    (row.over_under || '').toUpperCase() === 'UNDER' ? 'UNDER' : 'OVER';

  const playerInitials = playerName
    .split(' ')
    .map((n: string) => n[0] || '')
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const g1  = Number(row.g1  ?? 0);
  const g2  = Number(row.g2  ?? 0);
  const g3  = Number(row.g3  ?? 0);
  const g4  = Number(row.g4  ?? 0);
  const g5  = Number(row.g5  ?? 0);
  const g6  = Number(row.g6  ?? 0);
  const g7  = Number(row.g7  ?? 0);
  const g8  = Number(row.g8  ?? 0);
  const g9  = Number(row.g9  ?? 0);
  const g10 = Number(row.g10 ?? 0);

  return {
    // identity
    id:              encodeURIComponent(`${playerName}-${index}`),

    // core PlayerProp fields
    player:          playerName,
    playType,
    line:            bookLine,
    projectedPts:    aiProj,
    diff:            edge,
    tier,
    score:           blendScore,
    team:            row.team     || '',
    opponent:        row.opponent || '',
    hitRateL10,
    hitRateDisplay:  `${hitRateL10}%`,
    confidence,
    confidenceDisplay: `${confidence}%`,
    algoRecord:      row.algo_record  || '',
    modelRecord:     row.model_record || '',
    lastResult:      '',
    algoModelBlend:  blendScore,
    biasScore:       Number(row.bias_score ?? 0),
    tierRank:        TIER_ORDER[tier] ?? 99,
    last10Games:     [g1, g2, g3, g4, g5, g6, g7, g8, g9, g10],
    edgeDisplay:     `${edge >= 0 ? '+' : ''}${edge.toFixed(1)} pts`,
    valueLabel:      tier === 'S' || tier === 'A' ? 'High Value'
                     : tier === 'B' ? 'Medium Value' : 'Low Edge',
    isHighValue:     (tier === 'S' || tier === 'A') && confidence >= 60,

    // display / PropCard fields
    playerName,
    playerInitials,
    bookLine,
    aiProj,
    edge,
    g1, g2, g3, g4, g5, g6, g7, g8, g9, g10,
    projection:  aiProj,
    matchup:     '',
    propType:    'pts',
    category:    undefined,
  };
}
