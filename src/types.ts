export enum PlayerRole {
  Batsman = "Batsman",
  Bowler = "Bowler",
  AllRounder = "All-rounder",
  WicketKeeper = "Wicketkeeper-Batsman"
}

export enum GameFormat {
  FC = "First-Class (FC)",
  ListA = "List A",
  T20 = "T20"
}

export interface PlayerStats {
  id: string;
  name: string;
  state: string;
  role: PlayerRole;
  format: GameFormat;
  matches: number;
  
  // Batting stats
  battingInnings: number;
  notOuts: number;
  battingRuns: number;
  highestScore: number;
  highestScoreNotOut: boolean;
  ballsFaced: number;
  battingStrikeRate: number;
  hundreds: number;
  fiftyPlus: number;
  fours?: number;
  sixes?: number;
  
  // Bowling stats
  bowlingInnings: number;
  ballsBowled: number;
  runsConceded: number;
  wickets: number;
  bestBowlingWickets: number;
  bestBowlingRuns: number;
  bowlingEconomy: number;
  bowlingStrikeRate: number; // Balls per wicket (ballsBowled / wickets)

  // Fielding stats
  catches?: number;
  stumpings?: number;

  // Custom visual configurations
  avatarEmoji?: string;
  avatarColor?: string;
}

export type StatComparisonMetric = 
  | "battingAverage"
  | "battingStrikeRate"
  | "battingRuns"
  | "wickets"
  | "bowlingEconomy"
  | "bowlingStrikeRate";
