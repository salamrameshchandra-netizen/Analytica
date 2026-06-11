import { PlayerStats, PlayerRole, GameFormat } from "./types";

export const initialPlayers: PlayerStats[] = [
  {
    id: "v-kohli",
    name: "Virat Kohli",
    state: "Delhi",
    role: PlayerRole.Batsman,
    format: GameFormat.FC,
    matches: 295,
    battingInnings: 283,
    notOuts: 44,
    battingRuns: 13848,
    highestScore: 183,
    highestScoreNotOut: false,
    ballsFaced: 14811,
    battingStrikeRate: 93.5,
    hundreds: 50,
    fiftyPlus: 72,
    fours: 1358,
    sixes: 151,
    bowlingInnings: 48,
    ballsBowled: 641,
    runsConceded: 680,
    wickets: 5,
    bestBowlingWickets: 1,
    bestBowlingRuns: 15,
    bowlingEconomy: 6.36,
    bowlingStrikeRate: 128.2,
    catches: 142,
    stumpings: 0
  },
  {
    id: "j-bumrah",
    name: "Jasprit Bumrah",
    state: "Gujarat",
    role: PlayerRole.Bowler,
    format: GameFormat.T20,
    matches: 89,
    battingInnings: 35,
    notOuts: 19,
    battingRuns: 110,
    highestScore: 16,
    highestScoreNotOut: true,
    ballsFaced: 171,
    battingStrikeRate: 64.3,
    hundreds: 0,
    fiftyPlus: 0,
    fours: 12,
    sixes: 3,
    bowlingInnings: 89,
    ballsBowled: 4711,
    runsConceded: 3612,
    wickets: 149,
    bestBowlingWickets: 6,
    bestBowlingRuns: 19,
    bowlingEconomy: 4.60,
    bowlingStrikeRate: 31.6,
    catches: 21,
    stumpings: 0
  },
  {
    id: "g-maxwell",
    name: "Glenn Maxwell",
    state: "Victoria",
    role: PlayerRole.AllRounder,
    format: GameFormat.T20,
    matches: 141,
    battingInnings: 127,
    notOuts: 18,
    battingRuns: 3895,
    highestScore: 201,
    highestScoreNotOut: true,
    ballsFaced: 2681,
    battingStrikeRate: 145.3,
    hundreds: 4,
    fiftyPlus: 23,
    fours: 356,
    sixes: 192,
    bowlingInnings: 104,
    ballsBowled: 2475,
    runsConceded: 2228,
    wickets: 74,
    bestBowlingWickets: 4,
    bestBowlingRuns: 46,
    bowlingEconomy: 5.40,
    bowlingStrikeRate: 33.4,
    catches: 82,
    stumpings: 0
  },
  {
    id: "r-pant",
    name: "Rishabh Pant",
    state: "Uttarakhand",
    role: PlayerRole.WicketKeeper,
    format: GameFormat.FC,
    matches: 135,
    battingInnings: 128,
    notOuts: 15,
    battingRuns: 4250,
    highestScore: 159,
    highestScoreNotOut: true,
    ballsFaced: 5210,
    battingStrikeRate: 81.5,
    hundreds: 8,
    fiftyPlus: 21,
    fours: 420,
    sixes: 118,
    bowlingInnings: 0,
    ballsBowled: 0,
    runsConceded: 0,
    wickets: 0,
    bestBowlingWickets: 0,
    bestBowlingRuns: 0,
    bowlingEconomy: 0,
    bowlingStrikeRate: 0,
    catches: 185,
    stumpings: 32
  },
  {
    id: "s-smith",
    name: "Steve Smith",
    state: "New South Wales",
    role: PlayerRole.Batsman,
    format: GameFormat.FC,
    matches: 155,
    battingInnings: 139,
    notOuts: 17,
    battingRuns: 5617,
    highestScore: 164,
    highestScoreNotOut: false,
    ballsFaced: 6442,
    battingStrikeRate: 87.2,
    hundreds: 12,
    fiftyPlus: 33,
    fours: 604,
    sixes: 42,
    bowlingInnings: 62,
    ballsBowled: 1215,
    runsConceded: 1092,
    wickets: 28,
    bestBowlingWickets: 3,
    bestBowlingRuns: 16,
    bowlingEconomy: 5.39,
    bowlingStrikeRate: 43.4,
    catches: 168,
    stumpings: 0
  },
  {
    id: "r-khan",
    name: "Rashid Khan",
    state: "Kabul",
    role: PlayerRole.AllRounder,
    format: GameFormat.T20,
    matches: 105,
    battingInnings: 85,
    notOuts: 15,
    battingRuns: 1320,
    highestScore: 60,
    highestScoreNotOut: true,
    ballsFaced: 1267,
    battingStrikeRate: 104.2,
    hundreds: 0,
    fiftyPlus: 5,
    fours: 105,
    sixes: 78,
    bowlingInnings: 105,
    ballsBowled: 5640,
    runsConceded: 3968,
    wickets: 183,
    bestBowlingWickets: 7,
    bestBowlingRuns: 18,
    bowlingEconomy: 4.22,
    bowlingStrikeRate: 30.8,
    catches: 38,
    stumpings: 0
  },
  {
    id: "b-azam",
    name: "Babar Azam",
    state: "Punjab",
    role: PlayerRole.Batsman,
    format: GameFormat.ListA,
    matches: 117,
    battingInnings: 114,
    notOuts: 13,
    battingRuns: 5729,
    highestScore: 158,
    highestScoreNotOut: false,
    ballsFaced: 6473,
    battingStrikeRate: 88.5,
    hundreds: 19,
    fiftyPlus: 32,
    fours: 588,
    sixes: 56,
    bowlingInnings: 4,
    ballsBowled: 24,
    runsConceded: 38,
    wickets: 0,
    bestBowlingWickets: 0,
    bestBowlingRuns: 0,
    bowlingEconomy: 9.50,
    bowlingStrikeRate: 0,
    catches: 45,
    stumpings: 0
  },
  {
    id: "m-starc",
    name: "Mitchell Starc",
    state: "New South Wales",
    role: PlayerRole.Bowler,
    format: GameFormat.ListA,
    matches: 121,
    battingInnings: 59,
    notOuts: 23,
    battingRuns: 575,
    highestScore: 52,
    highestScoreNotOut: false,
    ballsFaced: 745,
    battingStrikeRate: 77.2,
    hundreds: 0,
    fiftyPlus: 1,
    fours: 48,
    sixes: 14,
    bowlingInnings: 121,
    ballsBowled: 6062,
    runsConceded: 5262,
    wickets: 236,
    bestBowlingWickets: 6,
    bestBowlingRuns: 28,
    bowlingEconomy: 5.21,
    bowlingStrikeRate: 25.7,
    catches: 31,
    stumpings: 0
  }
];

// Helper functions for stats calculations
export function calculateBattingStrikeRate(player: PlayerStats): number {
  if (!player.ballsFaced || player.ballsFaced <= 0) {
    return player.battingInnings > 0 ? player.battingStrikeRate || 0 : 0;
  }
  return Number(((player.battingRuns / player.ballsFaced) * 100).toFixed(2));
}

export function calculateBattingAverage(player: PlayerStats): number {
  const dismissals = player.battingInnings - player.notOuts;
  if (dismissals <= 0) {
    return player.battingInnings > 0 ? player.battingRuns : 0;
  }
  return Number((player.battingRuns / dismissals).toFixed(2));
}

export function calculateBowlingAverage(player: PlayerStats): number {
  if (player.wickets <= 0) return 0;
  return Number((player.runsConceded / player.wickets).toFixed(2));
}

export function calculateBowlingStrikeRate(player: PlayerStats): number {
  if (player.wickets <= 0) return 0;
  return Number((player.ballsBowled / player.wickets).toFixed(2));
}

export function calculateBowlingEconomy(player: PlayerStats): number {
  if (player.ballsBowled <= 0) return 0;
  const overs = player.ballsBowled / 6;
  return Number((player.runsConceded / overs).toFixed(2));
}

export function calculateAllRounderIndex(player: PlayerStats): number {
  const batAvg = calculateBattingAverage(player);
  const bowlAvg = calculateBowlingAverage(player);
  
  if (player.role === PlayerRole.Bowler && bowlAvg > 0) {
    // Bowler's all-rounder capacity
    return Number((batAvg * (100 / bowlAvg)).toFixed(1));
  }
  
  if (bowlAvg <= 0) {
    return 0; // Pure batsman with no bowling wickets
  }
  
  // Traditional all-rounder rating: Batting Average * 1.5 - Bowling Average
  return Number((batAvg - bowlAvg).toFixed(2));
}
