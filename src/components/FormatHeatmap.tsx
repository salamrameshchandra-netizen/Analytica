import { useState, useMemo } from "react";
import { PlayerStats, PlayerRole, GameFormat } from "../types";
import { getDefaultAvatarEmoji, getDefaultAvatarColor, getAvatarColorClasses } from "./StatsForm";
import {
  calculateBattingAverage,
  calculateBattingStrikeRate,
  calculateBowlingEconomy,
  calculateBowlingStrikeRate,
  calculateBowlingAverage
} from "../initialData";
import { Trophy, Shield, Swords, Sparkles, Filter, Search } from "lucide-react";

interface FormatHeatmapProps {
  players: PlayerStats[];
}

type HeatmapMetric =
  | "battingAverage"
  | "battingStrikeRate"
  | "wickets"
  | "bowlingEconomy"
  | "bowlingStrikeRate";

export default function FormatHeatmap({ players }: FormatHeatmapProps) {
  const [activeMetric, setActiveMetric] = useState<HeatmapMetric>("battingAverage");
  const [roleFilter, setRoleFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedPlayerRow, setSelectedPlayerRow] = useState<string | null>(null);

  // Group players by name to aggregate their stats across different formats
  const groupedPlayers = useMemo(() => {
    interface PlayerGroup {
      formats: { [key in GameFormat]?: PlayerStats };
      role: PlayerRole;
      state: string;
      avatarEmoji?: string;
      avatarColor?: string;
    }
    const map = new Map<string, PlayerGroup>();

    players.forEach((p) => {
      const key = p.name.trim();
      if (!map.has(key)) {
        map.set(key, { 
          formats: {}, 
          role: p.role, 
          state: p.state,
          avatarEmoji: p.avatarEmoji,
          avatarColor: p.avatarColor
        });
      }
      const existing = map.get(key)!;
      existing.formats[p.format] = p;
    });

    return Array.from(map.entries()).map(([name, entry]) => ({
      name,
      role: entry.role,
      state: entry.state,
      formats: entry.formats,
      avatarEmoji: entry.avatarEmoji,
      avatarColor: entry.avatarColor
    }));
  }, [players]);

  // Handle active filters (Search and Role)
  const filteredGroupedPlayers = useMemo(() => {
    return groupedPlayers.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.state.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === "All" || p.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [groupedPlayers, searchQuery, roleFilter]);

  // Calculate cell styling and value for the designated metric
  const getCellStats = (playerFormats: { [key in GameFormat]?: PlayerStats }, format: GameFormat) => {
    const record = playerFormats[format];
    if (!record) return { display: "—", raw: 0, style: "bg-slate-950/20 text-slate-700 border-slate-900/50" };

    let raw = 0;
    let display = "";
    let style = "";

    switch (activeMetric) {
      case "battingAverage": {
        raw = calculateBattingAverage(record);
        display = raw > 0 ? raw.toFixed(1) : "—";
        if (raw <= 0) {
          style = "bg-slate-950/20 text-slate-700 border-slate-900/50";
        } else if (raw < 22) {
          style = "bg-rose-950/30 text-rose-300/90 border border-rose-500/10 hover:border-rose-500/30";
        } else if (raw < 35) {
          style = "bg-slate-800 text-slate-300 border border-slate-700/40 hover:border-slate-500/20";
        } else if (raw < 45) {
          style = "bg-indigo-950/40 text-indigo-300 border border-indigo-500/20 hover:border-indigo-500/40";
        } else if (raw < 55) {
          style = "bg-emerald-950/50 text-emerald-300 border border-emerald-500/20 hover:border-emerald-500/55";
        } else {
          style = "bg-emerald-500 text-black font-extrabold border border-emerald-400 shadow-sm shadow-emerald-500/10";
        }
        break;
      }
      case "battingStrikeRate": {
        raw = calculateBattingStrikeRate(record);
        display = raw > 0 ? raw.toFixed(1) : "—";
        if (raw <= 0) {
          style = "bg-slate-950/20 text-slate-700 border-slate-900/50";
        } else if (raw < 75) {
          style = "bg-slate-800 text-slate-400 border border-slate-700/30 hover:border-slate-500/10";
        } else if (raw < 100) {
          style = "bg-emerald-950/30 text-emerald-300 border border-emerald-500/10 hover:border-emerald-500/30";
        } else if (raw < 135) {
          style = "bg-amber-955/20 text-amber-300 border border-amber-500/20 hover:border-amber-500/55";
        } else {
          style = "bg-amber-500 text-black font-extrabold border border-amber-400 shadow-sm shadow-amber-500/10";
        }
        break;
      }
      case "wickets": {
        raw = record.wickets;
        display = raw > 0 ? raw.toString() : "—";
        if (raw <= 0) {
          style = "bg-slate-950/20 text-slate-700 border-slate-900/50";
        } else if (raw < 15) {
          style = "bg-slate-800 text-slate-400 border border-slate-700/30 hover:border-slate-500/10";
        } else if (raw < 50) {
          style = "bg-sky-955/20 text-sky-400 border border-sky-550/10 hover:border-sky-500/30";
        } else if (raw < 120) {
          style = "bg-sky-950/50 text-sky-300 border border-sky-500/30 hover:border-sky-500/55";
        } else {
          style = "bg-sky-500 text-black font-extrabold border border-sky-400 shadow-sm shadow-sky-500/10";
        }
        break;
      }
      case "bowlingEconomy": {
        raw = calculateBowlingEconomy(record);
        display = raw > 0 ? raw.toFixed(2) : "—";
        if (raw <= 0) {
          style = "bg-slate-950/20 text-slate-750 border-slate-900/50";
        } else if (raw > 7.5) {
          style = "bg-rose-950/30 text-rose-350 border border-rose-500/10 hover:border-rose-500/30";
        } else if (raw > 5.5) {
          style = "bg-slate-800 text-slate-300 border border-slate-700/40 hover:border-slate-500/20";
        } else if (raw > 4.2) {
          style = "bg-indigo-950/30 text-indigo-300 border border-indigo-500/20 hover:border-indigo-500/40";
        } else {
          // Excellent economy, lower is better!
          style = "bg-emerald-500 text-black font-extrabold border border-emerald-400 shadow-sm shadow-emerald-500/10";
        }
        break;
      }
      case "bowlingStrikeRate": {
        raw = calculateBowlingStrikeRate(record);
        display = raw > 0 ? raw.toFixed(1) : "—";
        if (raw <= 0) {
          style = "bg-slate-950/20 text-slate-700 border-slate-900/50";
        } else if (raw > 45) {
          style = "bg-rose-950/25 text-rose-300 border border-rose-500/10 hover:border-rose-500/25";
        } else if (raw > 30) {
          style = "bg-slate-800 text-slate-300 border border-slate-700/45 hover:border-slate-500/15";
        } else if (raw > 22) {
          style = "bg-indigo-950/40 text-indigo-300 border border-indigo-550/20 hover:border-indigo-500/45";
        } else {
          // Lethal strike rate (lower is better!)
          style = "bg-[#38bdf8] text-black font-extrabold border border-sky-400 shadow-sm shadow-sky-500/10";
        }
        break;
      }
    }

    // Explicitly customize the font colors of List A and T20 columns in the heatmap to make them pop!
    if (raw > 0) {
      if (format === GameFormat.ListA) {
        // Use high-contrast vibrant Sky Blue / Cyan font colors for List A column
        style = style
          .replace(/\btext-indigo-300\b/g, "text-sky-400 font-extrabold")
          .replace(/\btext-slate-300\b/g, "text-sky-305 font-bold")
          .replace(/\btext-slate-400\b/g, "text-sky-300 font-bold");
      } else if (format === GameFormat.T20) {
        // Use high-contrast vibrant Amber / Gold font colors for T20 column
        style = style
          .replace(/\btext-indigo-300\b/g, "text-amber-400 font-extrabold")
          .replace(/\btext-slate-300\b/g, "text-amber-400 font-bold")
          .replace(/\btext-slate-400\b/g, "text-amber-400 font-bold");
      }
    }

    return { display, raw, style };
  };

  // Determine Specialist features for the selected player
  const getSpecialistDetails = (name: string, formats: { [key in GameFormat]?: PlayerStats }) => {
    const list: { format: string; strength: string; details: string; highlight: string }[] = [];
    let isFcStar = false;
    let isT20Star = false;
    let isListAStar = false;

    if (formats[GameFormat.FC]) {
      const fc = formats[GameFormat.FC]!;
      const battingAvg = calculateBattingAverage(fc);
      if (battingAvg >= 45) {
        isFcStar = true;
        list.push({
          format: "First-Class (FC)",
          strength: "Pristine Durability",
          details: `Batting Average of ${battingAvg.toFixed(1)} confirms world-standard multi-day reliability.`,
          highlight: "text-emerald-400"
        });
      }
      if (fc.wickets >= 25) {
        list.push({
          format: "First-Class (FC)",
          strength: "Red-ball Penetration",
          details: `Captured ${fc.wickets} wickets, proving vital test bowling workload compatibility.`,
          highlight: "text-sky-400"
        });
      }
    }

    if (formats[GameFormat.ListA]) {
      const la = formats[GameFormat.ListA]!;
      const battingAvg = calculateBattingAverage(la);
      if (battingAvg >= 40) {
        isListAStar = true;
        list.push({
          format: "List A",
          strength: "Anchor Accumulator",
          details: `Maintains a strong ${battingAvg.toFixed(1)} average, ideal for anchoring limited overs pursuits.`,
          highlight: "text-indigo-400"
        });
      }
      if (la.wickets >= 30) {
        list.push({
          format: "List A",
          strength: "Overs Dictator",
          details: `Secured ${la.wickets} wickets, representing high middle-overs tactical dominance.`,
          highlight: "text-sky-400"
        });
      }
    }

    if (formats[GameFormat.T20]) {
      const t20 = formats[GameFormat.T20]!;
      const battingSR = calculateBattingStrikeRate(t20);
      if (battingSR >= 135) {
        isT20Star = true;
        list.push({
          format: "T20",
          strength: "Power Accelerant",
          details: `Strikes at dynamic ${battingSR.toFixed(1)} runs per 100 balls to disrupt powerplays.`,
          highlight: "text-amber-400"
        });
      }
      if (t20.wickets >= 30) {
        list.push({
          format: "T20",
          strength: "Death Breakthrough",
          details: `Snatched ${t20.wickets} T20 wickets with tactical economy safeguards.`,
          highlight: "text-sky-400"
        });
      }
    }

    // Assign final composite specialist badge
    let badgeText = "All Format Standard";
    let badgeStyle = "bg-[#16161c] border border-slate-800 text-slate-400";

    const starsCount = [isFcStar, isListAStar, isT20Star].filter(Boolean).length;

    if (starsCount >= 2) {
      badgeText = "Cross-Format Elite";
      badgeStyle = "bg-indigo-950/55 border border-indigo-500/30 text-indigo-300";
    } else if (isFcStar) {
      badgeText = "Red-Ball Classicist";
      badgeStyle = "bg-emerald-950/60 border border-emerald-500/30 text-emerald-400";
    } else if (isT20Star) {
      badgeText = "T20 Blitz Specialist";
      badgeStyle = "bg-amber-950/50 border border-amber-500/30 text-amber-400";
    } else if (isListAStar) {
      badgeText = "One-Day Pivot Specialist";
      badgeStyle = "bg-sky-950/50 border border-sky-505/30 text-sky-400";
    }

    return { strengths: list, badgeText, badgeStyle };
  };

  // Pre-calculated stats details panel for the selected row player
  const clickedPlayerDetails = useMemo(() => {
    if (!selectedPlayerRow) return null;
    const player = filteredGroupedPlayers.find((p) => p.name === selectedPlayerRow);
    if (!player) return null;

    const analysis = getSpecialistDetails(player.name, player.formats);
    return {
      ...player,
      ...analysis
    };
  }, [selectedPlayerRow, filteredGroupedPlayers]);

  return (
    <div id="format-heatmap-widget" className="bg-[#121216] border border-slate-800 rounded p-5 shadow-xl shadow-black/40 space-y-6">
      
      {/* Widget Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 px-1.5 text-[9px] bg-emerald-500 font-bold text-black rounded font-mono uppercase">New Engine</span>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" /> Format Specialists Heatmap
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            Cross-indexing batting longevity, strike acceleration, and defensive wicket-taking across standard game modes.
          </p>
        </div>

        {/* Heatmap Metric Selector */}
        <div className="flex flex-wrap gap-1.5 bg-slate-900 p-1 rounded border border-slate-800 text-[10px] font-mono">
          <button
            onClick={() => { setActiveMetric("battingAverage"); }}
            className={`px-2.5 py-1 font-bold rounded transition-all uppercase ${
              activeMetric === "battingAverage"
                ? "bg-emerald-950 text-emerald-400 border border-emerald-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Batting Avg
          </button>
          <button
            onClick={() => { setActiveMetric("battingStrikeRate"); }}
            className={`px-2.5 py-1 font-bold rounded transition-all uppercase ${
              activeMetric === "battingStrikeRate"
                ? "bg-amber-950 text-amber-400 border border-amber-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Strike Rate
          </button>
          <button
            onClick={() => { setActiveMetric("wickets"); }}
            className={`px-2.5 py-1 font-bold rounded transition-all uppercase ${
              activeMetric === "wickets"
                ? "bg-sky-950 text-sky-400 border border-sky-505/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Wickets
          </button>
          <button
            onClick={() => { setActiveMetric("bowlingEconomy"); }}
            className={`px-2.5 py-1 font-bold rounded transition-all uppercase ${
              activeMetric === "bowlingEconomy"
                ? "bg-indigo-950 text-indigo-400 border border-indigo-505/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Economy Rates
          </button>
          <button
            onClick={() => { setActiveMetric("bowlingStrikeRate"); }}
            className={`px-2.5 py-1 font-bold rounded transition-all uppercase ${
              activeMetric === "bowlingStrikeRate"
                ? "bg-rose-950 text-rose-400 border border-rose-500/20"
                : "text-slate-400 hover:text-white relative"
            }`}
          >
            Bowling SR
          </button>
        </div>
      </div>

      {/* Auxiliary Interactive Search and Role Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search Input bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search roster files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 text-xs text-white rounded font-mono outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Role Selector */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full bg-[#16161c] border border-slate-800 rounded px-2 py-1.5 text-slate-350 text-xs font-mono outline-none focus:border-emerald-500"
          >
            <option value="All">All Roles</option>
            <option value={PlayerRole.Batsman}>Batsmen</option>
            <option value={PlayerRole.Bowler}>Bowlers</option>
            <option value={PlayerRole.AllRounder}>All-Rounders</option>
            <option value={PlayerRole.WicketKeeper}>Wicketkeepers</option>
          </select>
        </div>

        {/* Info label */}
        <div className="text-[10px] text-slate-500 font-mono flex items-center justify-end">
          <span>Displaying {filteredGroupedPlayers.length} unique profiles</span>
        </div>
      </div>

      {/* Heatmap Grid & Analytical Sidebars split screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Side: Heatmap Grid layout */}
        <div className="lg:col-span-8 overflow-x-auto min-w-0" id="heatmap-panel-grid">
          <table className="w-full text-left border-collapse border-spacing-0 select-none">
            <thead>
              <tr className="border-b border-slate-800 font-mono text-[10px] tracking-wider text-slate-505 uppercase">
                <th className="pb-3 pl-3 pr-4 font-bold">Roster Player</th>
                <th className="pb-3 px-3 text-center font-bold text-emerald-400 w-1/4">FC (First-Class)</th>
                <th className="pb-3 px-3 text-center font-bold text-indigo-400 w-1/4">List A (One-Day)</th>
                <th className="pb-3 px-3 text-center font-bold text-amber-400 w-1/4">T20</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredGroupedPlayers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-600 font-mono text-xs">
                    SQUAD REGISTRY CONTAINS NO PROFILES MATCHING FILTER DIRECTIVES
                  </td>
                </tr>
              ) : (
                filteredGroupedPlayers.map(({ name, role, state, formats, avatarEmoji, avatarColor }) => {
                  const fcStats = getCellStats(formats, GameFormat.FC);
                  const listAStats = getCellStats(formats, GameFormat.ListA);
                  const t20Stats = getCellStats(formats, GameFormat.T20);
                  const isSelected = selectedPlayerRow === name;

                  return (
                    <tr
                      key={name}
                      onClick={() => setSelectedPlayerRow(isSelected ? null : name)}
                      className={`group hover:bg-[#16161c]/60 cursor-pointer transition-colors ${
                        isSelected ? "bg-slate-900/80 hover:bg-slate-900" : ""
                      }`}
                    >
                      {/* Name / Info cell with avatar */}
                      <td className="py-3 pl-3 pr-4">
                        <div className="flex items-center gap-2.5">
                          {/* Round Avatar Container */}
                          <div 
                            className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs shrink-0 shadow-inner select-none transition-all ${
                              getAvatarColorClasses(avatarColor || getDefaultAvatarColor(role)).bg
                            } ${
                              getAvatarColorClasses(avatarColor || getDefaultAvatarColor(role)).border
                            } ${
                              getAvatarColorClasses(avatarColor || getDefaultAvatarColor(role)).text
                            }`}
                            title={`${name} (${role})`}
                          >
                            {avatarEmoji || getDefaultAvatarEmoji(role)}
                          </div>

                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors uppercase">
                              {name}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {state} · <span className="text-[9.5px] uppercase">{role}</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* FC format cell */}
                      <td className="py-3 px-2">
                        <div
                          className={`mx-auto max-w-[100px] h-8 rounded flex items-center justify-center text-[11px] font-mono font-bold transition-all ${fcStats.style}`}
                          title={`FC Stats: ${name} (Value: ${fcStats.display})`}
                        >
                          {fcStats.display}
                        </div>
                      </td>

                      {/* List A format cell */}
                      <td className="py-3 px-2">
                        <div
                          className={`mx-auto max-w-[100px] h-8 rounded flex items-center justify-center text-[11px] font-mono font-bold transition-all ${listAStats.style}`}
                          title={`List A Stats: ${name} (Value: ${listAStats.display})`}
                        >
                          {listAStats.display}
                        </div>
                      </td>

                      {/* T20 format cell */}
                      <td className="py-3 px-2">
                        <div
                          className={`mx-auto max-w-[100px] h-8 rounded flex items-center justify-center text-[11px] font-mono font-bold transition-all ${t20Stats.style}`}
                          title={`T20 Stats: ${name} (Value: ${t20Stats.display})`}
                        >
                          {t20Stats.display}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Right Side: Specialists Details Diagnosis Panel */}
        <div className="lg:col-span-4 bg-[#16161c] border border-slate-800 rounded p-4 flex flex-col justify-between" id="specialist-details-panel">
          {clickedPlayerDetails ? (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider font-mono ${clickedPlayerDetails.badgeStyle}`}>
                  {clickedPlayerDetails.badgeText}
                </span>
                <h4 className="text-md font-bold text-white mt-1 uppercase tracking-tight">{clickedPlayerDetails.name}</h4>
                <p className="text-[10px] text-slate-505 font-mono">State Cadre: {clickedPlayerDetails.state} · {clickedPlayerDetails.role}</p>
              </div>

              {/* Strength analysis */}
              <div className="space-y-3">
                <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">SPECIALTY BREAKDOWNS</h5>
                
                {clickedPlayerDetails.strengths.length === 0 ? (
                  <p className="text-xs text-slate-500 font-mono leading-relaxed bg-[#1b1b22] p-3 rounded border border-slate-800/40">
                    No elite thresholds exceeded in the loaded stats. Player operates at standard squad baseline values.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {clickedPlayerDetails.strengths.map((str, idx) => (
                      <div key={idx} className="bg-slate-900 border border-slate-800/80 p-2.5 rounded text-left">
                        <div className="flex items-center justify-between font-mono text-[9px] font-bold uppercase">
                          <span className="text-slate-500">{str.format}</span>
                          <span className={str.highlight}>{str.strength}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-sans mt-1 leading-normal">{str.details}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Formats present indicators */}
              <div className="pt-2">
                <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-2">FORMAT COMPLIANCE</h5>
                <div className="flex gap-2">
                  <span className={`flex-1 text-center py-1 text-[9px] font-mono font-bold rounded border uppercase ${
                    clickedPlayerDetails.formats[GameFormat.FC] 
                      ? "bg-emerald-950/20 text-emerald-400 border-emerald-500/20" 
                      : "bg-slate-950/40 text-slate-700 border-slate-900/60"
                  }`}>
                    FC
                  </span>
                  <span className={`flex-1 text-center py-1 text-[9px] font-mono font-bold rounded border uppercase ${
                    clickedPlayerDetails.formats[GameFormat.ListA] 
                      ? "bg-sky-950/20 text-sky-400 border-sky-505/20" 
                      : "bg-slate-950/40 text-slate-700 border-slate-900/60"
                  }`}>
                    List A
                  </span>
                  <span className={`flex-1 text-center py-1 text-[9px] font-mono font-bold rounded border uppercase ${
                    clickedPlayerDetails.formats[GameFormat.T20] 
                      ? "bg-amber-955/20 text-amber-400 border-amber-500/20" 
                      : "bg-slate-950/40 text-slate-705 border-slate-900/60"
                  }`}>
                    T20
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-10 h-10 rounded-full bg-slate-900/80 border border-slate-800 flex items-center justify-center text-slate-500">
                <Trophy className="w-4 h-4 text-slate-500" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-400 uppercase font-mono">Specialist Diagnostician</h4>
                <p className="text-[11px] text-slate-500 leading-normal max-w-[200px]">
                  Click on any player row in the roster grid to load real-time specialty audits and format breakdowns.
                </p>
              </div>
            </div>
          )}

          {/* Color Scale Legend */}
          <div className="border-t border-slate-800/80 pt-3 mt-4 space-y-2">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block font-mono">HEAT DENSITY SCALE</span>
            <div className="flex items-center gap-1.5 font-mono text-[9px] text-slate-450 justify-between">
              <span>Inactive</span>
              <div className="flex h-2.5 flex-1 rounded overflow-hidden mx-2 border border-slate-800">
                <div className="flex-1 bg-slate-950/25"></div>
                <div className="flex-1 bg-slate-800"></div>
                <div className="flex-1 bg-indigo-950/50"></div>
                <div className="flex-1 bg-emerald-950/50"></div>
                <div className="flex-1 bg-emerald-500"></div>
              </div>
              <span>Elite Performance</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
