import { useState, useMemo } from "react";
import { PlayerStats } from "../types";
import { getDefaultAvatarEmoji, getDefaultAvatarColor, getAvatarColorClasses } from "./StatsForm";
import {
  calculateBattingAverage,
  calculateBowlingEconomy,
  calculateBowlingStrikeRate,
  calculateBowlingAverage,
  calculateAllRounderIndex
} from "../initialData";
import { Swords, Check, ArrowRightLeft, Sparkles, Download } from "lucide-react";
import { generateDuelComparisonPdf } from "../utils/pdfGenerator";

const tooltipDictionary: Record<string, { desc: string; formula?: string }> = {
  "Matches Played": {
    desc: "Total match appearances recorded across all active formats."
  },
  "Batting Runs": {
    desc: "Cumulative total runs scored by the batsman across all matches played."
  },
  "Batting Average": {
    desc: "Measures scoring durability and consistency per dismissal.",
    formula: "Runs / (Innings - Not Outs)"
  },
  "Batting Strike Rate": {
    desc: "Measures speed of scoring. Average runs scored per 100 balls faced.",
    formula: "(Runs / Balls Faced) * 100"
  },
  "Highest Score": {
    desc: "The highest number of runs scored in a single innings by this player. An asterisk (*) represents a Not Out innings."
  },
  "Hundreds (105s)": {
    desc: "The number of innings where the player scored 100 or more runs."
  },
  "Fifties (50s)": {
    desc: "The number of innings where the player scored between 50 and 99 runs."
  },
  "Wickets Taken": {
    desc: "The cumulative count of dismissals / wickets captured by the bowler."
  },
  "Bowling Economy": {
    desc: "Measure of defensive run control. Average runs conceded per over.",
    formula: "Runs Conceded / (Balls Bowled / 6)"
  },
  "Bowling Strike Rate": {
    desc: "Lethality breakthrough frequency. Average number of deliveries required to capture one wicket.",
    formula: "Balls Bowled / Wickets"
  },
  "All-rounder Rating Index": {
    desc: "Proprietary multi-dimensional caliber rating index combining batting longevity and bowling breakthrough efficiency.",
    formula: "For Bowlers: BattingAvg * (100 / BowlingAvg). For others: BattingAvg - BowlingAvg"
  }
};

interface PlayerCompareProps {
  players: PlayerStats[];
}

export default function PlayerCompare({ players }: PlayerCompareProps) {
  const [playerAId, setPlayerAId] = useState<string>("");
  const [playerBId, setPlayerBId] = useState<string>("");

  // Set default side-by-side comparisons
  useState(() => {
    if (players.length >= 2) {
      setPlayerAId(players[0].id);
      setPlayerBId(players[1].id);
    } else if (players.length > 0) {
      setPlayerAId(players[0].id);
    }
  });

  const playerA = useMemo(() => players.find((p) => p.id === playerAId) || null, [players, playerAId]);
  const playerB = useMemo(() => players.find((p) => p.id === playerBId) || null, [players, playerBId]);

  // Derived stats
  const statsA = useMemo(() => {
    if (!playerA) return null;
    return {
      average: calculateBattingAverage(playerA),
      bowlingEcon: calculateBowlingEconomy(playerA),
      bowlingSR: calculateBowlingStrikeRate(playerA),
      bowlingAvg: calculateBowlingAverage(playerA),
      arIndex: calculateAllRounderIndex(playerA)
    };
  }, [playerA]);

  const statsB = useMemo(() => {
    if (!playerB) return null;
    return {
      average: calculateBattingAverage(playerB),
      bowlingEcon: calculateBowlingEconomy(playerB),
      bowlingSR: calculateBowlingStrikeRate(playerB),
      bowlingAvg: calculateBowlingAverage(playerB),
      arIndex: calculateAllRounderIndex(playerB)
    };
  }, [playerB]);

  // Compare row metrics: helper to check who is higher/better
  // betterHigher: true if more is better (runs, average, wickets), false if less is better (economy, bowling strike rate)
  const getWinner = (valA: number, valB: number, betterHigher = true) => {
    if (valA === valB) return "tie";
    if (betterHigher) {
      return valA > valB ? "A" : "B";
    } else {
      // For economy/bowling strike rate, 0 indicates inactive, so check that first
      if (valA <= 0) return "B";
      if (valB <= 0) return "A";
      return valA < valB ? "A" : "B";
    }
  };

  const comparisonRows = [
    {
      label: "Matches Played",
      valA: playerA?.matches || 0,
      valB: playerB?.matches || 0,
      betterHigher: true,
      formatter: (v: number) => v.toString()
    },
    {
      label: "Batting Runs",
      valA: playerA?.battingRuns || 0,
      valB: playerB?.battingRuns || 0,
      betterHigher: true,
      formatter: (v: number) => v.toLocaleString()
    },
    {
      label: "Batting Average",
      valA: statsA?.average || 0,
      valB: statsB?.average || 0,
      betterHigher: true,
      formatter: (v: number) => v > 0 ? v.toFixed(2) : "0.00"
    },
    {
      label: "Batting Strike Rate",
      valA: playerA?.battingStrikeRate || 0,
      valB: playerB?.battingStrikeRate || 0,
      betterHigher: true,
      formatter: (v: number) => v > 0 ? v.toFixed(1) : "0.0"
    },
    {
      label: "Highest Score",
      valA: playerA?.highestScore || 0,
      valB: playerB?.highestScore || 0,
      betterHigher: true,
      formatter: (v: number, p: PlayerStats | null) => {
        if (!p) return "0";
        return `${v}${p.highestScoreNotOut ? "*" : ""}`;
      }
    },
    {
      label: "Hundreds (105s)",
      valA: playerA?.hundreds || 0,
      valB: playerB?.hundreds || 0,
      betterHigher: true,
      formatter: (v: number) => v.toString()
    },
    {
      label: "Fifties (50s)",
      valA: playerA?.fiftyPlus || 0,
      valB: playerB?.fiftyPlus || 0,
      betterHigher: true,
      formatter: (v: number) => v.toString()
    },
    {
      label: "Wickets Taken",
      valA: playerA?.wickets || 0,
      valB: playerB?.wickets || 0,
      betterHigher: true,
      formatter: (v: number) => v.toString()
    },
    {
      label: "Bowling Economy",
      valA: statsA?.bowlingEcon || 0,
      valB: statsB?.bowlingEcon || 0,
      betterHigher: false,
      formatter: (v: number) => v > 0 ? v.toFixed(2) : "N/A"
    },
    {
      label: "Bowling Strike Rate",
      valA: statsA?.bowlingSR || 0,
      valB: statsB?.bowlingSR || 0,
      betterHigher: false,
      formatter: (v: number) => v > 0 ? v.toFixed(1) : "N/A"
    },
    {
      label: "All-rounder Rating Index",
      valA: statsA?.arIndex || 0,
      valB: statsB?.arIndex || 0,
      betterHigher: true,
      formatter: (v: number) => v.toFixed(2)
    }
  ];

  return (
    <div id="player-compare-section" className="bg-[#121216] rounded border border-slate-800 p-5 shadow-xl shadow-black/40">
      <div id="compare-section-header" className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-5">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-emerald-400" /> Side-by-Side Duel Telemetry
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 font-mono">Compare two players with dynamic high density parameter indexes</p>
        </div>
        <div id="compare-section-actions" className="flex items-center gap-2.5">
          {playerA && playerB && (
            <button
              id="export-duel-pdf-btn"
              onClick={() => generateDuelComparisonPdf(playerA, playerB)}
              title="Export Side-by-Side Duel Telemetry to PDF Report"
              className="px-3 py-1 bg-[#16161c] hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-350 hover:text-white rounded flex items-center gap-1.5 text-xs font-bold font-mono transition-all uppercase tracking-wider h-7.5"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" /> Export PDF
            </button>
          )}
          <Swords className="w-4 h-4 text-slate-600 animate-pulse hidden sm:block" />
        </div>
      </div>

      {players.length < 2 ? (
        <div className="bg-slate-950/50 rounded p-8 text-center border border-slate-850">
          <p className="font-bold text-slate-400 font-mono">INSUFFICIENT SQUAD RECORDINGS</p>
          <p className="text-xs text-slate-500 mt-1 font-mono">Please register or add at least two players to initialize side-by-side comparisons.</p>
        </div>
      ) : (
        <div id="compare-main-container" className="space-y-5">
          
          {/* Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#16161c] p-4 rounded border border-slate-850">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-1.5 font-mono">Player Alpha Input</label>
              <select
                id="compare-select-pA"
                value={playerAId}
                onChange={(e) => setPlayerAId(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#0a0a0c] text-white font-mono border border-slate-800 rounded focus:border-emerald-500 text-xs outline-none"
              >
                {players.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.id === playerBId} className="bg-[#121216]">
                    {p.name} ({p.state}) [{p.format}]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-1.5 font-mono">Player Beta Input</label>
              <select
                id="compare-select-pB"
                value={playerBId}
                onChange={(e) => setPlayerBId(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#0a0a0c] text-white font-mono border border-slate-800 rounded focus:border-emerald-500 text-xs outline-none"
              >
                {players.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.id === playerAId} className="bg-[#121216]">
                    {p.name} ({p.state}) [{p.format}]
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cards Header Display in Dark Style */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            {/* Player A Card */}
            {playerA && (
              <div className="bg-[#16161c] border border-slate-800 rounded p-4 text-center relative overflow-hidden flex flex-col items-center">
                <span className="absolute top-2 right-2 bg-emerald-950/55 text-emerald-400 border border-emerald-500/20 font-bold text-[9px] uppercase px-1.5 py-0.5 rounded font-mono">ALPHA</span>
                
                {/* Visual Avatar Badge */}
                <div 
                  className={`w-12 h-12 rounded-full border flex items-center justify-center text-xl shrink-0 shadow-inner select-none transition-all my-2 ${
                    getAvatarColorClasses(playerA.avatarColor || getDefaultAvatarColor(playerA.role)).bg
                  } ${
                    getAvatarColorClasses(playerA.avatarColor || getDefaultAvatarColor(playerA.role)).border
                  } ${
                    getAvatarColorClasses(playerA.avatarColor || getDefaultAvatarColor(playerA.role)).text
                  }`}
                >
                  {playerA.avatarEmoji || getDefaultAvatarEmoji(playerA.role)}
                </div>

                <span className="text-[10px] text-slate-500 font-mono block">{playerA.state} · <span className="text-sky-400">{playerA.format}</span></span>
                <h4 className="text-sm font-bold text-white truncate mt-1 w-full">{playerA.name}</h4>
                <p className="text-[9px] font-bold text-emerald-400 bg-emerald-950/20 inline-block px-2 py-0.5 rounded border border-emerald-500/20 mt-1 font-mono uppercase">{playerA.role}</p>
              </div>
            )}

            {/* Player B Card */}
            {playerB && (
              <div className="bg-[#16161c] border border-slate-800 rounded p-4 text-center relative overflow-hidden flex flex-col items-center">
                <span className="absolute top-2 right-2 bg-blue-950/55 text-blue-400 border border-blue-500/20 font-bold text-[9px] uppercase px-1.5 py-0.5 rounded font-mono">BETA</span>
                
                {/* Visual Avatar Badge */}
                <div 
                  className={`w-12 h-12 rounded-full border flex items-center justify-center text-xl shrink-0 shadow-inner select-none transition-all my-2 ${
                    getAvatarColorClasses(playerB.avatarColor || getDefaultAvatarColor(playerB.role)).bg
                  } ${
                    getAvatarColorClasses(playerB.avatarColor || getDefaultAvatarColor(playerB.role)).border
                  } ${
                    getAvatarColorClasses(playerB.avatarColor || getDefaultAvatarColor(playerB.role)).text
                  }`}
                >
                  {playerB.avatarEmoji || getDefaultAvatarEmoji(playerB.role)}
                </div>

                <span className="text-[10px] text-slate-500 font-mono block">{playerB.state} · <span className="text-sky-400">{playerB.format}</span></span>
                <h4 className="text-sm font-bold text-white truncate mt-1 w-full">{playerB.name}</h4>
                <p className="text-[9px] font-bold text-blue-400 bg-blue-950/20 inline-block px-2 py-0.5 rounded border border-blue-500/10 mt-1 font-mono uppercase">{playerB.role}</p>
              </div>
            )}
          </div>

          {/* Detailed Statistics Comparison Rows */}
          <div className="border border-slate-800 rounded overflow-hidden divide-y divide-slate-800 bg-slate-950/15">
            <div className="grid grid-cols-12 bg-slate-950/45 text-[9px] font-bold text-slate-500 py-2.5 uppercase tracking-wider text-center font-mono">
              <div className="col-span-5 px-3 text-left">Statistic Metric</div>
              <div className="col-span-3 px-2">Alpha Performance</div>
              <div className="col-span-1 px-1">Duel</div>
              <div className="col-span-3 px-2">Beta Performance</div>
            </div>

            {comparisonRows.map((row, idx) => {
              const winner = getWinner(row.valA, row.valB, row.betterHigher);
              const formattedA = row.formatter(row.valA, playerA);
              const formattedB = row.formatter(row.valB, playerB);

              return (
                <div key={idx} className="grid grid-cols-12 py-3 items-center text-center text-xs hover:bg-[#16161c]/60 transition font-mono border-b border-slate-900/60">
                  {/* Aspect Label */}
                  <div className="col-span-5 text-left px-4 font-bold text-slate-350 relative group">
                    {tooltipDictionary[row.label] ? (
                      <span className="cursor-help border-b border-dotted border-slate-600 hover:text-white transition-colors flex items-center gap-1 w-fit">
                        {row.label}
                        <span className="text-[8px] text-slate-500 group-hover:text-emerald-400">ⓘ</span>
                        
                        {/* Tooltip Card */}
                        <span className="absolute left-4 bottom-full mb-2 w-64 bg-[#0f0f13] border border-slate-850 text-slate-300 p-2.5 rounded-md shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 text-[10px] font-mono leading-normal font-normal text-left z-50">
                          <span className="font-bold text-white block mb-0.5 font-sans">{row.label}</span>
                          {tooltipDictionary[row.label].formula && (
                            <span className="block text-emerald-450 mb-1">Formula: {tooltipDictionary[row.label].formula}</span>
                          )}
                          <span className="block text-slate-400 font-sans">{tooltipDictionary[row.label].desc}</span>
                        </span>
                      </span>
                    ) : (
                      row.label
                    )}
                  </div>
                  
                  {/* Player A score */}
                  <div className={`col-span-3 px-2 ${
                    winner === "A" ? "text-emerald-450 font-bold text-sm" : "text-slate-505"
                  }`}>
                    <div className="flex items-center justify-center gap-1.5">
                      {formattedA}
                      {winner === "A" && <Check className="w-3.5 h-3.5 text-emerald-400 hidden sm:inline shrink-0" />}
                    </div>
                  </div>

                  {/* Icon Indicator */}
                  <div className="col-span-1 text-slate-600 flex justify-center text-center">
                    <span className="text-[9px] bg-[#0a0a0c] border border-slate-800 text-slate-500 font-bold px-1 py-0.5 rounded h-4 flex items-center justify-center">
                      VS
                    </span>
                  </div>

                  {/* Player B score */}
                  <div className={`col-span-3 px-2 ${
                    winner === "B" ? "text-emerald-450 font-bold text-sm" : "text-slate-550"
                  }`}>
                    <div className="flex items-center justify-center gap-1.5">
                      {winner === "B" && <Check className="w-3.5 h-3.5 text-emerald-400 hidden sm:inline shrink-0" />}
                      {formattedB}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Key Insights Alert box */}
          <div className="p-4 bg-[#16161c] rounded border border-slate-800 flex gap-3 text-xs">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-slate-400 leading-relaxed font-mono">
              <strong className="block font-bold mb-0.5 text-emerald-450 uppercase text-[10px]">Active Duel Verdict Matrix</strong>
              {playerA && playerB && (
                <span>
                  <strong>{playerA.name}</strong> statistics are highlighted in <span className="text-emerald-450">green</span> when demonstrating supreme consistency/scoring speed (Batting Avg/SR) or bowling capacity.
                  Conversely, <strong>{playerB.name}</strong> statistics are highlighted when displaying protective excellence (lower Bowling Economy/Bowling Strike Rate).
                </span>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
