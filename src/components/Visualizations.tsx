import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  CartesianGrid,
  Cell
} from "recharts";
import { PlayerStats, PlayerRole, GameFormat } from "../types";
import {
  calculateBattingAverage,
  calculateBowlingStrikeRate,
  calculateBowlingEconomy,
  calculateBowlingAverage
} from "../initialData";
import { Trophy, Shield, Swords, Activity, ArrowUpRight, TrendingUp } from "lucide-react";
import FormatHeatmap from "./FormatHeatmap";

interface VisualizationsProps {
  players: PlayerStats[];
}

export default function Visualizations({ players }: VisualizationsProps) {
  const [activeTab, setActiveTab] = useState<"batting" | "bowling" | "specialists" | "comparison">("specialists");
  const [selectedMetric, setSelectedMetric] = useState<"battingAverage" | "battingStrikeRate" | "wickets" | "battingRuns">("battingAverage");

  // Format data for batting scatters
  const battingData = useMemo(() => {
    return players
      .filter((p) => p.battingInnings > 0)
      .map((p) => {
        const avg = calculateBattingAverage(p);
        return {
          id: p.id,
          name: p.name,
          role: p.role,
          battingAverage: avg,
          battingStrikeRate: p.battingStrikeRate,
          runs: p.battingRuns,
          state: p.state,
          format: p.format
        };
      });
  }, [players]);

  // Format data for bowling scatters
  const bowlingData = useMemo(() => {
    return players
      .filter((p) => p.wickets > 0 || p.ballsBowled > 0)
      .map((p) => {
        const sr = calculateBowlingStrikeRate(p);
        const econ = calculateBowlingEconomy(p);
        const avg = calculateBowlingAverage(p);
        return {
          id: p.id,
          name: p.name,
          role: p.role,
          bowlingStrikeRate: sr,
          bowlingEconomy: econ,
          bowlingAverage: avg,
          wickets: p.wickets,
          state: p.state,
          format: p.format
        };
      });
  }, [players]);

  // Compare active stats for all players across all three formats (FC, List A, T20)
  const comparisonData = useMemo(() => {
    const playerMap = new Map<string, { name: string; state: string; role: string; FC: number; ListA: number; T20: number }>();

    players.forEach((p) => {
      const nameKey = p.name.trim();
      if (!playerMap.has(nameKey)) {
        playerMap.set(nameKey, {
          name: p.name,
          state: p.state,
          role: p.role,
          FC: 0,
          ListA: 0,
          T20: 0
        });
      }
      
      const record = playerMap.get(nameKey)!;
      const value = 
        selectedMetric === "battingAverage" ? calculateBattingAverage(p) :
        selectedMetric === "battingStrikeRate" ? p.battingStrikeRate :
        selectedMetric === "wickets" ? p.wickets : p.battingRuns;

      if (p.format === GameFormat.FC) {
        record.FC = Number(value.toFixed(1));
      } else if (p.format === GameFormat.ListA) {
        record.ListA = Number(value.toFixed(1));
      } else if (p.format === GameFormat.T20) {
        record.T20 = Number(value.toFixed(1));
      }
    });

    return Array.from(playerMap.values()).sort((a, b) => {
      const maxA = Math.max(a.FC, a.ListA, a.T20);
      const maxB = Math.max(b.FC, b.ListA, b.T20);
      return maxB - maxA;
    });
  }, [players, selectedMetric]);

  // Visual highlights / Top Performers
  const topBattingAveragePlayer = useMemo(() => {
    if (players.length === 0) return null;
    return [...players].sort((a, b) => calculateBattingAverage(b) - calculateBattingAverage(a))[0];
  }, [players]);

  const topWicketTaker = useMemo(() => {
    if (players.length === 0) return null;
    return [...players].sort((a, b) => b.wickets - a.wickets)[0];
  }, [players]);

  const highestStrikeRate = useMemo(() => {
    if (players.length === 0) return null;
    return [...players]
      .filter(p => p.battingInnings > 5) // Minimum 5 innings for SR lead
      .sort((a, b) => b.battingStrikeRate - a.battingStrikeRate)[0];
  }, [players]);

  return (
    <div id="visualizations-section" className="bg-[#121216] border border-slate-800 rounded p-5 shadow-xl shadow-black/40">
      {/* Overview Stats Cards in Dark Technical Style */}
      <div id="quick-stats-grid" className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {topBattingAveragePlayer && (
          <div id="stat-card-batting-leader" className="bg-[#16161c] border border-slate-800 p-4 rounded flex items-center gap-4 relative group cursor-help transition-all duration-200 hover:border-slate-700">
            <div className="w-10 h-10 rounded bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-wider text-slate-505 uppercase block flex items-center gap-1">
                Batting Leader <span className="text-[9px] text-slate-600 group-hover:text-emerald-400 transition-colors">ⓘ</span>
              </span>
              <h4 className="text-sm font-bold text-white mt-0.5">{topBattingAveragePlayer.name}</h4>
              <p className="text-xs text-emerald-400 font-mono mt-0.5">
                Avg: <span className="font-bold">{calculateBattingAverage(topBattingAveragePlayer)}</span> <span className="text-slate-600">|</span> Runs: {topBattingAveragePlayer.battingRuns}
              </p>
            </div>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-[#0f0f13] border border-slate-800 text-slate-300 p-3 rounded-md shadow-2xl z-50 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 text-xs font-mono font-normal leading-relaxed text-left">
              <p className="font-bold text-white mb-1 font-sans">Batting Leader Metrics</p>
              <div className="space-y-1 text-slate-400 font-sans text-[11px]">
                <p>This player achieves the squad's highest batting durability average.</p>
                <div className="font-mono text-[10px] text-emerald-400 border-t border-slate-800/80 pt-1 mt-1 space-y-0.5">
                  <p>Formula: Runs / Dismissals</p>
                  <p className="text-slate-500 font-sans text-[9.5px]">Dismissals = Innings - Not Outs</p>
                </div>
                <p>Definitively measures the average expected runs completed before the player is retired or dismissed.</p>
              </div>
            </div>
          </div>
        )}

        {topWicketTaker && (
          <div id="stat-card-bowling-leader" className="bg-[#16161c] border border-slate-800 p-4 rounded flex items-center gap-4 relative group cursor-help transition-all duration-200 hover:border-slate-700">
            <div className="w-10 h-10 rounded bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-sm">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-wider text-slate-505 uppercase block flex items-center gap-1">
                Bowling Leader <span className="text-[9px] text-slate-600 group-hover:text-sky-400 transition-colors">ⓘ</span>
              </span>
              <h4 className="text-sm font-bold text-white mt-0.5">{topWicketTaker.name}</h4>
              <p className="text-xs text-sky-400 font-mono mt-0.5">
                Wickets: <span className="font-bold">{topWicketTaker.wickets}</span> <span className="text-slate-600">|</span> Econ: {calculateBowlingEconomy(topWicketTaker)}
              </p>
            </div>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-[#0f0f13] border border-slate-800 text-slate-300 p-3 rounded-md shadow-2xl z-50 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 text-xs font-mono font-normal leading-relaxed text-left">
              <p className="font-bold text-white mb-1 font-sans">Bowling Leader Metrics</p>
              <div className="space-y-1 text-slate-400 font-sans text-[11px]">
                <p>This player captures the squad's maximum total wickets.</p>
                <div className="font-mono text-[10px] text-sky-400 border-t border-slate-800/80 pt-1 mt-1 space-y-0.5">
                  <p>Economy: Runs / (Balls / 6)</p>
                  <p>Strike Rate: Balls / Wickets</p>
                </div>
                <p>Economy rate quantifies average runs conceded per over (6 standard legal deliveries). Lower is elite.</p>
              </div>
            </div>
          </div>
        )}

        {highestStrikeRate && (
          <div id="stat-card-explosive-leader" className="bg-[#16161c] border border-slate-800 p-4 rounded flex items-center gap-4 relative group cursor-help transition-all duration-200 hover:border-slate-700">
            <div className="w-10 h-10 rounded bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-wider text-slate-505 uppercase block flex items-center gap-1">
                Explosive Batter <span className="text-[9px] text-slate-600 group-hover:text-amber-400 transition-colors">ⓘ</span>
              </span>
              <h4 className="text-sm font-bold text-white mt-0.5">{highestStrikeRate.name}</h4>
              <p className="text-xs text-amber-400 font-mono mt-0.5">
                SR: <span className="font-bold">{highestStrikeRate.battingStrikeRate}</span> <span className="text-slate-600">|</span> Matches: {highestStrikeRate.matches}
              </p>
            </div>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-[#0f0f13] border border-slate-800 text-slate-300 p-3 rounded-md shadow-2xl z-50 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 text-xs font-mono font-normal leading-relaxed text-left">
              <p className="font-bold text-white mb-1 font-sans">Explosive Leader Metrics</p>
              <div className="space-y-1 text-slate-400 font-sans text-[11px]">
                <p>Calculates who drives maximum scoring acceleration (minimum 5 innings played).</p>
                <p className="font-mono text-[10px] text-amber-400 border-t border-slate-800/80 pt-1 mt-1">
                  Formula: (Runs Scored / Balls Faced) * 100
                </p>
                <p>Represents average runs scored relative to every 100 deliveries faced.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Tabs in Technical Navy / Dark Mode Layout */}
      <div id="vis-tabs-header" className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-5">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" /> Player Quadrants & Telemetry
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 font-mono">Statistical map charting efficiency thresholds</p>
        </div>
        <div className="flex bg-slate-900 p-0.5 rounded border border-slate-800 font-mono flex-wrap">
          <button
            id="tab-btn-specialists"
            onClick={() => setActiveTab("specialists")}
            className={`px-3 py-1 text-xs font-bold rounded transition-all uppercase tracking-wider ${
              activeTab === "specialists"
                ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/20 shadow-none"
                : "text-slate-450 hover:text-white"
            }`}
          >
            Specialist Heatmap
          </button>
          <button
            id="tab-btn-batting"
            onClick={() => setActiveTab("batting")}
            className={`px-3 py-1 text-xs font-bold rounded transition-all uppercase tracking-wider ${
              activeTab === "batting"
                ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/20 shadow-none"
                : "text-slate-450 hover:text-white"
            }`}
          >
            Batting Core
          </button>
          <button
            id="tab-btn-bowling"
            onClick={() => setActiveTab("bowling")}
            className={`px-3 py-1 text-xs font-bold rounded transition-all uppercase tracking-wider ${
              activeTab === "bowling"
                ? "bg-sky-950/60 text-sky-400 border border-sky-505/20 shadow-none"
                : "text-slate-455 hover:text-white"
            }`}
          >
            Bowling Core
          </button>
          <button
            id="tab-btn-comparison"
            onClick={() => setActiveTab("comparison")}
            className={`px-3 py-1 text-xs font-bold rounded transition-all uppercase tracking-wider ${
              activeTab === "comparison"
                ? "bg-indigo-950/60 text-indigo-400 border border-indigo-505/25 shadow-none"
                : "text-slate-455 hover:text-white"
            }`}
          >
            Leaderboards
          </button>
        </div>
      </div>

      {/* Tab Area: Format Specialists Heatmap */}
      {activeTab === "specialists" && (
        <FormatHeatmap players={players} />
      )}

      {/* Tab Area 1: Batting Scatter (Average vs Strike Rate) */}
      {activeTab === "batting" && (
        <div id="vis-batting-panel" className="space-y-4">
          <div className="p-3 bg-emerald-50 rounded border border-emerald-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-emerald-800 flex items-center gap-1.5 text-xs uppercase tracking-wider font-mono">
                <TrendingUp className="w-3.5 h-3.5" /> Batting Power Quadrant Telemetry
              </h4>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed flex flex-wrap gap-x-1 items-center">
                Visualizing{" "}
                <span className="relative group inline-block cursor-help border-b border-dotted border-slate-400 text-slate-800 font-semibold px-0.5">
                  Batting Average (Survival)
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-[#0f0f13] border border-slate-800 text-slate-300 p-2.5 rounded-md shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 text-[10px] font-mono leading-normal font-normal text-left z-50">
                    <span className="font-bold text-white block mb-0.5 font-sans">Batting Average (Avg)</span>
                    Formula: Runs / (Innings - Not Outs)
                    <span className="block text-slate-500 font-sans mt-1">Measures a batsman's scoring consistency and longevity per dismissal.</span>
                  </span>
                </span>{" "}
                vs.{" "}
                <span className="relative group inline-block cursor-help border-b border-dotted border-slate-400 text-slate-800 font-semibold px-0.5">
                  Strike Rate (Aggression)
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-[#0f0f13] border border-slate-800 text-slate-300 p-2.5 rounded-md shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 text-[10px] font-mono leading-normal font-normal text-left z-50">
                    <span className="font-bold text-white block mb-0.5 font-sans">Batting Strike Rate (SR)</span>
                    Formula: (Runs Scored / Balls Faced) * 100
                    <span className="block text-slate-500 font-sans mt-1">Measures the scoring velocity or pace (runs scored per 100 balls).</span>
                  </span>
                </span>
                . Ideal elite batsmen reside in the <span className="text-emerald-700 font-semibold font-mono">top-right zone</span> (maximum score rate & safety).
              </p>
            </div>
            <div className="flex gap-3 text-[10px] text-slate-600 bg-white p-2 rounded border border-slate-205 shadow-sm font-mono">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Batsman</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> All-rounder</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-500"></span> Bowler</span>
            </div>
          </div>

          <div id="batting-chart-container" className="h-[340px] w-full bg-white p-4 rounded border border-slate-200/80 shadow-md">
            {battingData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 font-mono text-xs">
                SQUAD LOG EMPTY: NO DATA DETECTED FOR ANALYSIS.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    type="number" 
                    dataKey="battingAverage" 
                    name="Batting Average" 
                    unit="" 
                    label={{ value: 'BATTING AVERAGE (RUNS/DISMISSAL)', position: 'bottom', offset: 0, className: 'text-[10px] fill-slate-600 font-mono font-bold' }}
                    stroke="#64748b"
                    tick={{ className: 'text-[10px] fill-slate-600 font-mono' }}
                    domain={[0, 'auto']}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="battingStrikeRate" 
                    name="Strike Rate" 
                    unit="" 
                    label={{ value: 'STRIKE RATE (RUNS PER 100 BALLS)', angle: -90, position: 'insideLeft', offset: 0, className: 'text-[10px] fill-slate-600 font-mono font-bold' }}
                    stroke="#64748b"
                    tick={{ className: 'text-[10px] fill-slate-600 font-mono' }}
                    domain={[40, 'auto']}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-[#121216] border border-slate-800 text-slate-300 p-3 rounded shadow-xl text-xs space-y-1 font-mono">
                            <p className="font-bold text-white text-sm font-sans">{data.name}</p>
                            <p className="text-slate-500 text-[10px]">{data.state} · {data.role} · <span className="text-sky-400">{data.format}</span></p>
                            <div className="h-px bg-slate-800 my-1"></div>
                            <p className="flex justify-between gap-6"><span className="text-slate-500">BATTING AVERAGE:</span> <span className="font-bold text-emerald-400">{data.battingAverage}</span></p>
                            <p className="flex justify-between gap-6"><span className="text-slate-500">STRIKE RATE:</span> <span className="font-bold text-amber-400">{data.battingStrikeRate}</span></p>
                            <p className="flex justify-between gap-6"><span className="text-slate-500">TOTAL RUNS:</span> <span className="font-bold text-white">{data.runs}</span></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter name="Players" data={battingData}>
                    {battingData.map((entry, index) => {
                      let color = "#10b981"; // Batsman - emerald
                      if (entry.role === PlayerRole.AllRounder) color = "#6366f1"; // AllRounder - indigo
                      if (entry.role === PlayerRole.Bowler) color = "#0ea5e9"; // Bowler - sky
                      if (entry.role === PlayerRole.WicketKeeper) color = "#ec4899"; // Pink
                      return <Cell key={`cell-${index}`} fill={color} stroke="#000" strokeWidth={1} r={7} className="cursor-pointer" />;
                    })}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* Tab Area 2: Bowling Scatter (Economy vs Wickets/SR) */}
      {activeTab === "bowling" && (
        <div id="vis-bowling-panel" className="space-y-4">
          <div className="p-3 bg-sky-50 rounded border border-sky-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-sky-900 flex items-center gap-1.5 text-xs uppercase tracking-wider font-mono">
                <ArrowUpRight className="w-3.5 h-3.5" /> Bowling Efficiency Matrix
              </h4>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed flex flex-wrap gap-x-1 items-center">
                Visualizing{" "}
                <span className="relative group inline-block cursor-help border-b border-dotted border-slate-400 text-slate-800 font-semibold px-0.5">
                  Economy Rate (Runs/Over)
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-[#0f0f13] border border-slate-800 text-slate-300 p-2.5 rounded-md shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 text-[10px] font-mono leading-normal font-normal text-left z-50">
                    <span className="font-bold text-white block mb-0.5 font-sans">Bowling Economy (Econ)</span>
                    Formula: Runs Conceded / (Balls Bowled / 6)
                    <span className="block text-slate-500 font-sans mt-1">Represents average runs allowed per standard over of six deliveries. Lower is elite.</span>
                  </span>
                </span>{" "}
                vs.{" "}
                <span className="relative group inline-block cursor-help border-b border-dotted border-slate-400 text-slate-800 font-semibold px-0.5">
                  Strike Rate (Balls/Wkts)
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-[#0f0f13] border border-slate-800 text-slate-300 p-2.5 rounded-md shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 text-[10px] font-mono leading-normal font-normal text-left z-50">
                    <span className="font-bold text-white block mb-0.5 font-sans">Bowling Strike Rate (SR)</span>
                    Formula: Balls Bowled / Wickets Captured
                    <span className="block text-slate-500 font-sans mt-1">Measures frequency of breakthroughs. Represents average balls bowled to capture one wicket.</span>
                  </span>
                </span>{" "}
                and{" "}
                <span className="relative group inline-block cursor-help border-b border-dotted border-slate-400 text-slate-800 font-semibold px-0.5">
                  Bowling Average
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-[#0f0f13] border border-slate-800 text-slate-300 p-2.5 rounded-md shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 text-[10px] font-mono leading-normal font-normal text-left z-50">
                    <span className="font-bold text-white block mb-0.5 font-sans">Bowling Average (Avg)</span>
                    Formula: Runs Conceded / Wickets Captured
                    <span className="block text-slate-500 font-sans mt-1">Represents runs conceded for each wicket taken. Combine with strike rate for full accuracy.</span>
                  </span>
                </span>
                . Elite defensive bowlers reside in the <span className="text-sky-800 font-semibold font-mono">bottom-left zone</span> (minimal runs speed and high lethality).
              </p>
            </div>
            <div className="flex gap-3 text-[10px] text-slate-600 bg-white p-2 rounded border border-slate-205 shadow-sm font-mono">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-500"></span> Bowler</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> All-rounder</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Batsman</span>
            </div>
          </div>

          <div id="bowling-chart-container" className="h-[340px] w-full bg-white p-4 rounded border border-slate-200/80 shadow-md">
            {bowlingData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 font-mono text-xs">
                SQUAD LOG EMPTY: NO BALLING RECORDS ON SQUAD DETECTED.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    type="number" 
                    dataKey="bowlingEconomy" 
                    name="Economy Rate" 
                    unit="" 
                    label={{ value: 'ECONOMY RATE (RUNS/OVER)', position: 'bottom', offset: 0, className: 'text-[10px] fill-slate-600 font-mono font-bold' }}
                    stroke="#64748b"
                    tick={{ className: 'text-[10px] fill-slate-600 font-mono' }}
                    domain={[2, 'auto']}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="bowlingStrikeRate" 
                    name="Strike Rate" 
                    unit="" 
                    label={{ value: 'BOWLING STRIKE RATE (BALLS/WKTS)', angle: -90, position: 'insideLeft', offset: 0, className: 'text-[10px] fill-slate-600 font-mono font-bold' }}
                    stroke="#64748b"
                    tick={{ className: 'text-[10px] fill-slate-600 font-mono' }}
                    domain={[10, 'auto']}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-[#121216] border border-slate-800 text-slate-300 p-3 rounded shadow-xl text-xs space-y-1 font-mono">
                            <p className="font-bold text-white text-sm font-sans">{data.name}</p>
                            <p className="text-slate-500 text-[10px]">{data.state} · {data.role} · <span className="text-sky-400">{data.format}</span></p>
                            <div className="h-px bg-slate-800 my-1"></div>
                            <p className="flex justify-between gap-6"><span className="text-slate-500">ECONOMY RATE:</span> <span className="font-bold text-sky-450">{data.bowlingEconomy}</span></p>
                            <p className="flex justify-between gap-6"><span className="text-slate-500">STRIKE RATE:</span> <span className="font-bold text-amber-450">{data.bowlingStrikeRate} <span className="text-[10px] text-slate-500 font-normal">b/w</span></span></p>
                            <p className="flex justify-between gap-6"><span className="text-slate-500">WKTS captured:</span> <span className="font-bold text-white">{data.wickets}</span></p>
                            <p className="flex justify-between gap-6"><span className="text-slate-500">BOWLING AVG:</span> <span className="font-bold text-slate-300">{data.bowlingAverage}</span></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter name="Players" data={bowlingData}>
                    {bowlingData.map((entry, index) => {
                      let color = "#0ea5e9"; // Bowler - sky
                      if (entry.role === PlayerRole.AllRounder) color = "#6366f1"; // AllRounder - indigo
                      if (entry.role === PlayerRole.Batsman) color = "#10b981"; // Batsman - emerald
                      return <Cell key={`cell-${index}`} fill={color} stroke="#000" strokeWidth={1} r={7} className="cursor-pointer" />;
                    })}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* Tab Area 3: Squad Leaderboards (Bar Chart) */}
      {activeTab === "comparison" && (
        <div id="vis-comparison-panel" className="story-panel space-y-4">
          <div className="p-3 bg-indigo-950/10 rounded border border-indigo-505/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <h4 className="font-bold text-indigo-400 flex items-center gap-1.5 text-xs uppercase tracking-wider font-mono">
                <Trophy className="w-3.5 h-3.5" /> Stack Ranked Multi-Format Squad Telemetry
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Click parameters below to dynamically compare performance metrics across three game formats: First-Class (FC), List A, and T20.
              </p>
            </div>
            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2 font-mono">
              <div className="relative group">
                <button
                  id="metric-btn-bat-avg"
                  onClick={() => setSelectedMetric("battingAverage")}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded border transition-all uppercase tracking-wide cursor-help ${
                    selectedMetric === "battingAverage"
                      ? "bg-indigo-650 text-white border-indigo-500/30"
                      : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                  }`}
                >
                  Batting Avg
                </button>
                <span className="absolute bottom-full right-0 mb-2 w-64 bg-[#0f0f13] border border-slate-800 text-slate-300 p-2.5 rounded-md shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 text-[10px] font-mono leading-normal font-normal text-left z-50">
                  <span className="font-bold text-white block mb-0.5 font-sans">Batting Average</span>
                  Formula: Runs / (Innings - Not Outs)
                  <span className="block text-slate-500 font-sans mt-0.5">Measures scoring longevity. Higher figures indicate consistent run production.</span>
                </span>
              </div>

              <div className="relative group">
                <button
                  id="metric-btn-bat-sr"
                  onClick={() => setSelectedMetric("battingStrikeRate")}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded border transition-all uppercase tracking-wide cursor-help ${
                    selectedMetric === "battingStrikeRate"
                      ? "bg-indigo-650 text-white border-indigo-500/30"
                      : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                  }`}
                >
                  Batting SR
                </button>
                <span className="absolute bottom-full right-0 mb-2 w-64 bg-[#0f0f13] border border-slate-800 text-slate-300 p-2.5 rounded-md shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 text-[10px] font-mono leading-normal font-normal text-left z-50">
                  <span className="font-bold text-white block mb-0.5 font-sans">Batting Strike Rate</span>
                  Formula: (Runs / Balls Faced) * 100
                  <span className="block text-slate-500 font-sans mt-0.5">Measures batting acceleration. Average runs scored per 100 balls faced.</span>
                </span>
              </div>
              <div className="relative group">
                <button
                  id="metric-btn-wickets"
                  onClick={() => setSelectedMetric("wickets")}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded border transition-all uppercase tracking-wide cursor-help ${
                    selectedMetric === "wickets"
                      ? "bg-indigo-650 text-white border-indigo-500/30"
                      : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                  }`}
                >
                  Wickets
                </button>
                <span className="absolute bottom-full right-0 mb-2 w-64 bg-[#0f0f13] border border-slate-800 text-slate-300 p-2.5 rounded-md shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 text-[10px] font-mono leading-normal font-normal text-left z-50">
                  <span className="font-bold text-white block mb-0.5 font-sans">Wickets Captured</span>
                  Formula: sum(Wickets)
                  <span className="block text-slate-500 font-sans mt-0.5">Measures total wickets taken by the bowler. Key metric for bowling performance.</span>
                </span>
              </div>

              <div className="relative group">
                <button
                  id="metric-btn-bat-runs"
                  onClick={() => setSelectedMetric("battingRuns")}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded border transition-all uppercase tracking-wide cursor-help ${
                    selectedMetric === "battingRuns"
                      ? "bg-indigo-650 text-white border-indigo-500/30"
                      : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                  }`}
                >
                  Runs Scored
                </button>
                <span className="absolute bottom-full right-0 mb-2 w-64 bg-[#0f0f13] border border-slate-800 text-slate-300 p-2.5 rounded-md shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 text-[10px] font-mono leading-normal font-normal text-left z-50">
                  <span className="font-bold text-white block mb-0.5 font-sans">Total Runs Scored</span>
                  Formula: sum(Batting Runs)
                  <span className="block text-slate-500 font-sans mt-0.5">Measures cumulative scoring volume. Displays total career runs completed by each batsman.</span>
                </span>
              </div>
            </div>
          </div>

          <div id="leaderboard-chart-container" className="h-[345px] w-full bg-slate-950/20 p-3 rounded border border-slate-800/60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222432" />
                <XAxis 
                  dataKey="name" 
                  stroke="#475569"
                  tick={{ className: 'text-[9px] fill-slate-400 font-mono' }}
                  angle={-15}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis 
                  stroke="#475569"
                  tick={{ className: 'text-[10px] fill-slate-400 font-mono' }}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const metricLabel = 
                        selectedMetric === "battingAverage" ? "Batting Average" :
                        selectedMetric === "battingStrikeRate" ? "Strike Rate" :
                        selectedMetric === "wickets" ? "Wickets" : "Runs";
                      return (
                        <div className="bg-[#121216] border border-slate-800 text-slate-300 p-3 rounded shadow-xl text-xs font-mono min-w-[210px] z-50">
                          <p className="font-bold text-white font-sans text-sm mb-1">{data.name}</p>
                          <p className="text-[10px] text-indigo-400 mb-2 uppercase tracking-wide">{data.role} ({data.state})</p>
                          <div className="h-px bg-slate-800 my-1.5"></div>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5 font-bold">{metricLabel}:</p>
                          <div className="space-y-1.5">
                            <p className="flex justify-between gap-6">
                              <span className="text-emerald-400">First-Class (FC):</span>
                              <span className="text-white font-semibold font-mono">{data.FC > 0 ? data.FC : "—"}</span>
                            </p>
                            <p className="flex justify-between gap-6">
                              <span className="text-indigo-400">List A:</span>
                              <span className="text-white font-semibold font-mono">{data.ListA > 0 ? data.ListA : "—"}</span>
                            </p>
                            <p className="flex justify-between gap-6">
                              <span className="text-amber-400">T20:</span>
                              <span className="text-white font-semibold font-mono">{data.T20 > 0 ? data.T20 : "—"}</span>
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', paddingTop: '10px' }}
                  cursor={{ fill: 'transparent' }}
                />
                <Bar dataKey="FC" name="First-Class (FC)" fill="#10b981" radius={[2, 2, 0, 0]} />
                <Bar dataKey="ListA" name="List A" fill="#6366f1" radius={[2, 2, 0, 0]} />
                <Bar dataKey="T20" name="T20" fill="#f59e0b" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
