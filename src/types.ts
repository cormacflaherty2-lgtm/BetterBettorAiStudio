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
  tierRank: number;
  last10Games: number[];
  edgeDisplay: string;
  valueLabel: string;
  isHighValue: boolean;
  // Keep some old fields for compatibility if needed, or just follow user's new structure
  playerName?: string;
  playerInitials?: string;
  propType?: string;
  projection?: number;
  edge?: number;
  matchup?: string;
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
