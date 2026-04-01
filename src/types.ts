export type Tier = "S" | "A" | "B" | "C" | "D";

export interface PlayerProp {
  id: string;
  player: string;
  playType: "OVER" | "UNDER";
  line: number;
  projectedPts: number;
  diff: number;
  tier: string;
  score: number;
  team: string;
  opponent: string;
  hitRateL10: number;
  hitRateDisplay: string;
  confidence: number;
  confidenceDisplay: string;
  algoRecord: string;
  modelRecord: string;
  lastResult: string;
  algoModelBlend: number;
  biasScore: number;
  tierRank: number;
  last10Games: number[];
  edgeDisplay: string;
  valueLabel: string;
  isHighValue: boolean;

  // New MasterRanking schema fields
  playerName: string;
  playerInitials: string;
  bookLine: number;
  aiProj: number;
  edge: number;
  g1: number;
  g2: number;
  g3: number;
  g4: number;
  g5: number;
  g6: number;
  g7: number;
  g8: number;
  g9: number;
  g10: number;

  // PropCard display fields
  projection: number;
  matchup: string;
  propType: string;
  category?: string;
}

export interface Alert {
  id: string;
  type: "alert" | "hit" | "miss" | "system";
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  isHighPriority: boolean;
}

export interface GameStat {
  date: string;
  value: number;
  opponent: string;
  isProjection?: boolean;
}
