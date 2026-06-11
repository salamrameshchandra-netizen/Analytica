import { useState, useMemo, Fragment } from "react";
import { PlayerStats, PlayerRole, GameFormat } from "../types";
import { getDefaultAvatarEmoji, getDefaultAvatarColor, getAvatarColorClasses } from "./StatsForm";
import {
  calculateBattingAverage,
  calculateBowlingEconomy,
  calculateBowlingStrikeRate
} from "../initialData";
import { Search, Filter, Edit, Trash2, Plus, RefreshCw, FileText, Download, Database, ChevronDown, ChevronUp, Award, Zap, Shield, Sparkles, Activity } from "lucide-react";
import { motion } from "motion/react";

const getPlayerArchetype = (player: PlayerStats) => {
  const avg = calculateBattingAverage(player);
  const econ = calculateBowlingEconomy(player);
  const wickets = player.wickets || 0;
  
  if (player.role === PlayerRole.Batsman) {
    if (avg >= 45) return "Elite Top-Order Anchor";
    if (player.battingStrikeRate >= 135) return "Dynamic Power Hitter";
    return "Classical Batsman";
  }
  if (player.role === PlayerRole.Bowler) {
    if (wickets >= 40 && econ < 4.5) return "Elite Strike Bowler";
    if (econ > 0 && econ < 4.5) return "High-Precision Containment Bowler";
    return "Strike Bowler";
  }
  if (player.role === PlayerRole.AllRounder) {
    if (avg >= 30 && wickets >= 20) return "Premier Double-Threat All-Rounder";
    return "Balanced Multi-Role Asset";
  }
  if (player.role === PlayerRole.WicketKeeper) {
    if (avg >= 35) return "Elite Wicketkeeper-Batsman";
    return "Specialist Gloveman & Anchor";
  }
  return "Squad Representative";
};

const TrendIndicator = ({ 
  value, 
  average, 
  lowerIsBetter = false, 
  label 
}: { 
  value: number; 
  average: number; 
  lowerIsBetter?: boolean; 
  label: string; 
}) => {
  if (value === undefined || value === null || value <= 0 || average === undefined || average === null || average <= 0) return null;
  const diff = value - average;
  const pct = (Math.abs(diff) / average) * 100;
  const roundedPct = Math.round(pct);
  
  const isPositive = lowerIsBetter ? diff < 0 : diff > 0;
  
  if (Math.abs(diff) < 0.05) {
    return (
      <span 
        className="inline-flex items-center text-[10px] text-slate-500 ml-1.5 select-none cursor-help font-mono" 
        title={`${label} is matching the roster average of ${average.toFixed(1)}`}
      >
        ••
      </span>
    );
  }
  
  return (
    <span 
      className={`inline-flex items-center text-[9px] ml-1.5 select-none font-bold cursor-help ${
        isPositive ? "text-emerald-400" : "text-rose-500"
      }`} 
      title={`${label}: ${value.toFixed(1)} vs Roster Avg ${average.toFixed(1)} (${roundedPct}% ${isPositive ? "better" : "worse"})`}
    >
      {isPositive ? "▲" : "▼"}
    </span>
  );
};

interface PlayerListProps {
  players: PlayerStats[];
  onEdit: (player: PlayerStats) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
  onReset: () => void;
  onExportPdf: () => void;
  onImportClick: () => void;
}

export default function PlayerList({
  players,
  onEdit,
  onDelete,
  onAddNew,
  onReset,
  onExportPdf,
  onImportClick
}: PlayerListProps) {
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("All");
  const [selectedFormat, setSelectedFormat] = useState<string>("All");
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);

  const togglePlayerExpand = (playerId: string) => {
    setExpandedPlayerId((prev) => (prev === playerId ? null : playerId));
  };

  // Combine stats of all formats for players when viewing "All Formats"
  const combinedPlayers = useMemo<PlayerStats[]>(() => {
    const grouped = new Map<string, PlayerStats[]>();
    
    players.forEach(p => {
      const key = `${p.name.trim().toLowerCase()}|${(p.state || '').trim().toLowerCase()}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(p);
    });

    const combinedList: PlayerStats[] = [];

    grouped.forEach((records) => {
      if (records.length === 1) {
        // Only one format record available for this player, keep it as is
        combinedList.push({
          ...records[0]
        });
      } else {
        const base = records[0];
        
        let totalMatches = 0;
        let totalBattingInnings = 0;
        let totalNotOuts = 0;
        let totalBattingRuns = 0;
        let totalBallsFaced = 0;
        let totalHundreds = 0;
        let totalFiftyPlus = 0;
        let totalBowlingInnings = 0;
        let totalBallsBowled = 0;
        let totalRunsConceded = 0;
        let totalWickets = 0;
        
        let maxHighestScore = 0;
        let maxHighestNotOut = false;
        
        let bestBowlingW = -1;
        let bestBowlingR = 9999;

        records.forEach(r => {
          totalMatches += r.matches;
          totalBattingInnings += r.battingInnings;
          totalNotOuts += r.notOuts;
          totalBattingRuns += r.battingRuns;
          totalBallsFaced += (r.ballsFaced || 0);
          totalHundreds += r.hundreds;
          totalFiftyPlus += r.fiftyPlus;
          totalBowlingInnings += r.bowlingInnings || 0;
          totalBallsBowled += r.ballsBowled || 0;
          totalRunsConceded += r.runsConceded || 0;
          totalWickets += r.wickets || 0;

          if (r.highestScore > maxHighestScore) {
            maxHighestScore = r.highestScore;
            maxHighestNotOut = r.highestScoreNotOut;
          } else if (r.highestScore === maxHighestScore) {
            maxHighestNotOut = maxHighestNotOut || r.highestScoreNotOut;
          }

          const bowlingW = r.wickets || 0;
          const bowlingR = r.runsConceded || 0;
          if (bowlingW > bestBowlingW) {
            bestBowlingW = bowlingW;
            bestBowlingR = r.bestBowlingRuns || bowlingR;
          } else if (bowlingW === bestBowlingW) {
            if ((r.bestBowlingRuns || bowlingR) < bestBowlingR) {
              bestBowlingR = r.bestBowlingRuns || bowlingR;
            }
          }
        });

        // Calculate aggregate statistics
        const battingSR = totalBallsFaced > 0 ? Number(((totalBattingRuns / totalBallsFaced) * 100).toFixed(2)) : 0;
        const bowlingEcon = totalBallsBowled > 0 ? Number((totalRunsConceded / (totalBallsBowled / 6)).toFixed(2)) : 0;
        const bowlingSR = totalWickets > 0 ? Number((totalBallsBowled / totalWickets).toFixed(2)) : 0;

        combinedList.push({
          id: `combined-${base.name.replace(/\s+/g, '-').toLowerCase()}-${base.state.replace(/\s+/g, '-').toLowerCase()}`,
          name: base.name,
          state: base.state,
          role: base.role,
          format: "Combined" as any,
          matches: totalMatches,
          battingInnings: totalBattingInnings,
          notOuts: totalNotOuts,
          battingRuns: totalBattingRuns,
          highestScore: maxHighestScore,
          highestScoreNotOut: maxHighestNotOut,
          ballsFaced: totalBallsFaced,
          battingStrikeRate: battingSR,
          hundreds: totalHundreds,
          fiftyPlus: totalFiftyPlus,
          bowlingInnings: totalBowlingInnings,
          ballsBowled: totalBallsBowled,
          runsConceded: totalRunsConceded,
          wickets: totalWickets,
          bestBowlingWickets: bestBowlingW === -1 ? 0 : bestBowlingW,
          bestBowlingRuns: bestBowlingR === 9999 ? 0 : bestBowlingR,
          bowlingEconomy: bowlingEcon,
          bowlingStrikeRate: bowlingSR
        });
      }
    });

    return combinedList;
  }, [players]);

  // Calculate roster averages
  const rosterAverages = useMemo(() => {
    const listForAvg = selectedFormat === "All" ? combinedPlayers : players.filter((p) => p.format === selectedFormat);
    const activeList = listForAvg.length > 0 ? listForAvg : players;

    if (activeList.length === 0) {
      return { matches: 0, runs: 0, battingAvg: 0, battingSR: 0, wickets: 0, economy: 0 };
    }
    
    let totalMatches = 0;
    let totalRuns = 0;
    
    let totalBattingAvg = 0;
    let battingAvgCount = 0;
    
    let totalBattingSR = 0;
    let battingSRCount = 0;
    
    let totalWickets = 0;
    let wicketsCount = 0;
    
    let totalEconomy = 0;
    let economyCount = 0;

    activeList.forEach((p) => {
      totalMatches += p.matches;
      totalRuns += p.battingRuns;
      
      const bAvg = calculateBattingAverage(p);
      if (bAvg > 0) {
        totalBattingAvg += bAvg;
        battingAvgCount++;
      }
      
      if (p.battingStrikeRate > 0) {
        totalBattingSR += p.battingStrikeRate;
        battingSRCount++;
      }
      
      if (p.wickets > 0) {
        totalWickets += p.wickets;
        wicketsCount++;
      }
      
      const econ = calculateBowlingEconomy(p);
      if (econ > 0) {
        totalEconomy += econ;
        economyCount++;
      }
    });

    return {
      matches: totalMatches / activeList.length,
      runs: totalRuns / activeList.length,
      battingAvg: battingAvgCount > 0 ? totalBattingAvg / battingAvgCount : 0,
      battingSR: battingSRCount > 0 ? totalBattingSR / battingSRCount : 0,
      wickets: wicketsCount > 0 ? totalWickets / wicketsCount : 0,
      economy: economyCount > 0 ? totalEconomy / economyCount : 0,
    };
  }, [players, combinedPlayers, selectedFormat]);

  // Filter players list
  const filteredPlayers = useMemo(() => {
    const baseList = selectedFormat === "All" ? combinedPlayers : players;
    return baseList.filter((player) => {
      const matchSearch =
        player.name.toLowerCase().includes(search.toLowerCase()) ||
        (player.state && player.state.toLowerCase().includes(search.toLowerCase()));
      
      const matchRole =
        selectedRole === "All" || player.role === selectedRole;

      const matchFormat =
        selectedFormat === "All" || player.format === selectedFormat;

      return matchSearch && matchRole && matchFormat;
    });
  }, [players, combinedPlayers, search, selectedRole, selectedFormat]);

  return (
    <div id="player-list-section" className="bg-[#121216] rounded border border-slate-800 overflow-hidden shadow-xl shadow-black/40">
      
      {/* Filtering Header bar with technical controls */}
      <div className="bg-[#16161c] border-b border-slate-800 p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-1 max-w-2xl">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              id="search-player-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cricket players or state..."
              className="w-full pl-9 pr-4 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all font-mono"
            />
          </div>

          {/* Role Filter */}
          <div className="relative shrink-0 flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500 hidden sm:block" id="filter-icon" />
            <select
              id="role-filter-select"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-slate-300 focus:outline-none focus:border-emerald-500 font-mono"
            >
              <option value="All" className="bg-[#121216]">All Roles</option>
              <option value={PlayerRole.Batsman} className="bg-[#121216]">Batsmen</option>
              <option value={PlayerRole.Bowler} className="bg-[#121216]">Bowlers</option>
              <option value={PlayerRole.AllRounder} className="bg-[#121216]">All-rounders</option>
              <option value={PlayerRole.WicketKeeper} className="bg-[#121216]">Wicketkeepers</option>
            </select>
          </div>

          {/* Format Filter */}
          <div className="relative shrink-0 flex items-center gap-2">
            <select
              id="format-filter-select"
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-slate-300 focus:outline-none focus:border-emerald-500 font-mono"
            >
              <option value="All" className="bg-[#121216]">All Formats</option>
              <option value={GameFormat.FC} className="bg-[#121216]">First-Class (FC)</option>
              <option value={GameFormat.ListA} className="bg-[#121216]">List A</option>
              <option value={GameFormat.T20} className="bg-[#121216]">T20</option>
            </select>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Add New Player Button */}
          <button
            id="add-new-player-btn"
            onClick={onAddNew}
            className="px-3.5 py-1.5 text-xs font-bold text-black bg-emerald-400 hover:bg-emerald-300 rounded flex items-center gap-1.5 shadow-sm transition-all uppercase tracking-wider"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" /> Add Player
          </button>

          {/* Import CSV Button */}
          <button
            id="import-csv-btn"
            onClick={onImportClick}
            title="Import Player Statistics from CSV"
            className="px-3.5 py-1.5 text-xs font-bold text-slate-350 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 rounded flex items-center gap-1.5 shadow-sm transition-all uppercase tracking-wider transition-all"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" /> Import CSV
          </button>
          
          {/* Restore preloaded players */}
          <button
            id="reset-squad-btn"
            onClick={onReset}
            title="Restore original squad list"
            className="p-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 rounded text-slate-400 hover:text-white transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Grid or Table listing players */}
      <div className="overflow-x-auto">
        {filteredPlayers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <p className="font-bold text-slate-300 text-sm font-mono">NO RECORDS MATCHED THE QUERY</p>
            <p className="text-xs text-slate-500 font-mono">Try adjusting filters or checking spelling.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse" id="players-datatable">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 text-[10px] font-bold uppercase tracking-wider bg-slate-950/45 font-mono">
                <th className="w-10 px-2 py-3 text-center"></th>
                <th className="px-5 py-3">Player Detail</th>
                <th className="px-4 py-3">Matches</th>
                <th className="px-4 py-3 text-center">Innings</th>
                <th className="px-4 py-3">Total Runs</th>
                <th className="px-4 py-3">Batting Avg</th>
                <th className="px-4 py-3">Batting SR</th>
                <th className="px-4 py-3">Wickets</th>
                <th className="px-4 py-3">Bowling Econ</th>
                <th className="px-4 py-3 text-right px-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredPlayers.map((player) => {
                const isExpanded = expandedPlayerId === player.id;
                const battingAvg = calculateBattingAverage(player);
                const economy = calculateBowlingEconomy(player);
                const bowlingStrikeRate = calculateBowlingStrikeRate(player);
                const isPureBatsman = player.role === PlayerRole.Batsman || player.role === PlayerRole.WicketKeeper;

                return (
                  <Fragment key={player.id}>
                    <tr 
                      className={`hover:bg-slate-900/40 text-xs transition-colors items-center font-mono cursor-pointer select-none ${
                        isExpanded ? "bg-slate-900/35 border-l-2 border-emerald-400" : ""
                      }`}
                      onClick={() => togglePlayerExpand(player.id)}
                    >
                      {/* Chevron Toggle Button */}
                      <td className="w-10 px-2 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="p-1 rounded text-slate-500 hover:text-white transition-all transform focus:outline-none"
                          onClick={() => togglePlayerExpand(player.id)}
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 stroke-[2.5]" />
                          )}
                        </button>
                      </td>

                      {/* Name / State / Role / Format with Avatar Badge */}
                      <td className="px-5 py-3.5 min-w-[210px]">
                        <div className="flex items-center gap-3">
                          {/* Round Avatar Container */}
                          <div 
                            className={`w-8 h-8 rounded-full border flex items-center justify-center text-sm shrink-0 shadow-inner select-none transition-all ${
                              getAvatarColorClasses(player.avatarColor || getDefaultAvatarColor(player.role)).bg
                            } ${
                              getAvatarColorClasses(player.avatarColor || getDefaultAvatarColor(player.role)).border
                            } ${
                              getAvatarColorClasses(player.avatarColor || getDefaultAvatarColor(player.role)).text
                            }`}
                            title={`${player.name} (${player.role})`}
                          >
                            {player.avatarEmoji || getDefaultAvatarEmoji(player.role)}
                          </div>
                          
                          <div>
                            <div className="font-bold text-white text-xs tracking-tight font-sans">{player.name}</div>
                            <div className="flex flex-wrap items-center gap-1.5 text-slate-500 text-[10px] mt-0.5">
                              <span className="text-slate-400 font-medium">{player.state}</span>
                              <span>·</span>
                              <span className="text-emerald-400 uppercase font-semibold text-[9px] px-1 bg-emerald-950/20 rounded border border-emerald-500/10">{player.role}</span>
                              <span>·</span>
                              <span className="text-sky-400 uppercase font-bold text-[9px] px-1 bg-sky-950/20 rounded border border-sky-500/10">{player.format || "FC"}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Matches */}
                      <td className="px-4 py-3.5 text-slate-300 font-bold">
                        <div className="flex items-center gap-1">
                          <span>{player.matches}</span>
                          <TrendIndicator value={player.matches} average={rosterAverages.matches} label="Matches" />
                        </div>
                      </td>
 
                      {/* Batting Innings */}
                      <td className="px-4 py-3.5 text-center text-slate-400">
                        {player.battingInnings}
                      </td>
 
                      {/* Runs */}
                      <td className="px-4 py-3.5 text-slate-300">
                        <div className="flex items-center gap-1">
                          <span>{player.battingRuns.toLocaleString()}</span>
                          <TrendIndicator value={player.battingRuns} average={rosterAverages.runs} label="Runs" />
                        </div>
                      </td>
 
                      {/* Average */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          {battingAvg > 0 ? (
                            <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                              battingAvg >= 50
                                ? "bg-emerald-950/30 text-emerald-400 border border-emerald-500/20" 
                                : battingAvg >= 35 
                                ? "bg-indigo-950/30 text-indigo-400 border border-indigo-505/20"
                                : "bg-slate-900 text-slate-400 border border-slate-800/60"
                            }`}>
                              {battingAvg.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                          <TrendIndicator value={battingAvg} average={rosterAverages.battingAvg} label="Batting Avg" />
                        </div>
                      </td>
 
                      {/* Strike Rate */}
                      <td className="px-4 py-3.5 text-slate-300 font-medium">
                        <div className="flex items-center gap-1">
                          <span>{player.battingStrikeRate > 0 ? player.battingStrikeRate.toFixed(1) : "-"}</span>
                          <TrendIndicator value={player.battingStrikeRate} average={rosterAverages.battingSR} label="Batting SR" />
                        </div>
                      </td>
 
                      {/* Wickets */}
                      <td className="px-4 py-3.5 text-sky-400 font-bold">
                        <div className="flex items-center gap-1">
                          <span>{player.wickets > 0 ? player.wickets : "-"}</span>
                          <TrendIndicator value={player.wickets} average={rosterAverages.wickets} label="Wickets" />
                        </div>
                      </td>
 
                      {/* Bowling Economy */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          {economy > 0 ? (
                            <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                              economy <= 4.5
                                ? "text-emerald-400 bg-emerald-950/40 border border-emerald-500/25"
                                : economy <= 5.5
                                ? "text-indigo-400 bg-indigo-950/40 border border-indigo-500/25"
                                : "text-slate-400 bg-slate-900 border border-slate-800"
                            }`}>
                              {economy.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                          <TrendIndicator value={economy} average={rosterAverages.economy} lowerIsBetter={true} label="Bowling Econ" />
                        </div>
                      </td>
 
                      {/* Actions edit / delete */}
                      <td className="px-4 py-3.5 text-right px-6 min-w-[90px]" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            id={`edit-btn-${player.id}`}
                            onClick={() => onEdit(player)}
                            title="Edit Player Details"
                            className="p-1 text-slate-500 hover:text-emerald-400 hover:bg-emerald-950/30 border border-transparent hover:border-emerald-500/10 rounded transition-all"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`delete-btn-${player.id}`}
                            onClick={() => onDelete(player.id)}
                            title="Delete Player Record"
                            className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-500/10 rounded transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Player Details Row */}
                    {isExpanded && (
                      <tr className="bg-slate-950/50" onClick={(e) => e.stopPropagation()}>
                        <td colSpan={10} className="p-0 border-b border-slate-800 bg-[#09090c]">
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="p-6 bg-[#07070a] border-t border-slate-800/80 font-mono text-xs">
                              {/* Header Archetype row */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-800/60">
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded border flex items-center justify-center text-lg w-9 h-9 shrink-0 ${
                                    getAvatarColorClasses(player.avatarColor || getDefaultAvatarColor(player.role)).bg
                                  } ${
                                    getAvatarColorClasses(player.avatarColor || getDefaultAvatarColor(player.role)).border
                                  } ${
                                    getAvatarColorClasses(player.avatarColor || getDefaultAvatarColor(player.role)).text
                                  }`}>
                                    {player.avatarEmoji || getDefaultAvatarEmoji(player.role)}
                                  </div>
                                  <div>
                                    <h4 className="text-white font-bold font-sans text-sm tracking-tight">{player.name} &mdash; Player Statistics Ledger</h4>
                                    <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                                      Performance Archetype: <span className="text-emerald-400 font-bold">{getPlayerArchetype(player)}</span>
                                    </p>
                                  </div>
                                </div>
                                
                                {/* Format & Role quick pill layout */}
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-[10px] px-2.5 py-1 bg-slate-900 border border-slate-800 rounded text-slate-400">
                                    Matches: <strong className="text-white">{player.matches}</strong>
                                  </span>
                                  <span className="text-[10px] px-2.5 py-1 bg-slate-900 border border-slate-800 rounded text-slate-400">
                                    Format: <strong className="text-sky-400">{player.format || "FC"}</strong>
                                  </span>
                                </div>
                                                          {/* Roster detailed statistics blocks */}
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                
                                {/* BATTING SUB-DOSSIER */}
                                <div className="bg-[#121216]/80 border border-slate-800 rounded p-4 space-y-4">
                                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                                    <div className="flex items-center gap-2">
                                      <Award className="w-4 h-4 text-emerald-400" />
                                      <span className="font-sans font-bold text-white uppercase tracking-wider text-[11px]">BATTING ROSTER DOSSIER</span>
                                    </div>
                                    <span className="text-[10px] text-emerald-400 uppercase font-semibold">Active Metrics</span>
                                  </div>

                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3.5 gap-x-2">
                                    <div className="space-y-0.5">
                                      <div className="text-[9px] text-slate-500 uppercase tracking-widest">Innings / NO</div>
                                      <div className="text-white font-bold">{player.battingInnings} <span className="text-slate-500 text-[10px] font-normal">({player.notOuts} NO)</span></div>
                                    </div>
                                    <div className="space-y-0.5">
                                      <div className="text-[9px] text-slate-500 uppercase tracking-widest">Total Runs</div>
                                      <div className="text-emerald-400 font-bold font-mono">{player.battingRuns.toLocaleString()}</div>
                                    </div>
                                    <div className="space-y-0.5">
                                      <div className="text-[9px] text-slate-500 uppercase tracking-widest">Batting Average</div>
                                      <div className="text-white font-bold">{battingAvg > 0 ? battingAvg.toFixed(2) : "0.00"}</div>
                                    </div>
                                    <div className="space-y-0.5">
                                      <div className="text-[9px] text-slate-500 uppercase tracking-widest">Strike Rate</div>
                                      <div className="text-white font-bold flex items-center gap-1">
                                        <span>{player.battingStrikeRate > 0 ? player.battingStrikeRate.toFixed(1) : "0.0"}</span>
                                        <Zap className="w-3 h-3 text-emerald-400" />
                                      </div>
                                    </div>
                                    <div className="space-y-0.5">
                                      <div className="text-[9px] text-slate-500 uppercase tracking-widest">Highest Score</div>
                                      <div className="text-white font-bold">
                                        {player.highestScore > 0 ? (
                                          <>
                                            {player.highestScore}
                                            {player.highestScoreNotOut && <span className="text-emerald-400 font-bold">*</span>}
                                          </>
                                        ) : "0"}
                                      </div>
                                    </div>
                                    <div className="space-y-0.5">
                                      <div className="text-[9px] text-slate-500 uppercase tracking-widest">Century Peaks</div>
                                      <div className="text-white font-bold text-[11px]">
                                        <span className="text-emerald-400 font-bold">{player.hundreds}</span>x100 | <span className="text-yellow-400 font-bold">{player.fiftyPlus}</span>x50
                                      </div>
                                    </div>
                                    <div className="space-y-0.5 col-span-2 sm:col-span-3 pt-1 border-t border-slate-800/40 flex justify-between items-center">
                                      <div>
                                        <div className="text-[9px] text-slate-500 uppercase tracking-widest">Balls Faced</div>
                                        <div className="text-slate-300 font-medium text-[11px]">{player.ballsFaced ? player.ballsFaced.toLocaleString() : "0"} balls</div>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-[9px] text-slate-505 uppercase tracking-widest">Boundaries</div>
                                        <div className="text-emerald-400 font-bold text-[11px] font-mono">
                                          {player.fours || 0}x4s | {player.sixes || 0}x6s
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Progress Bars for Batting metrics */}
                                  <div className="space-y-2 pt-2 border-t border-slate-800">
                                     <div>
                                        <div className="flex justify-between text-[9px] text-slate-500 uppercase mb-1">
                                          <span>Strike Rate Speed (Benchmark 150)</span>
                                          <span className="text-emerald-400 font-bold">{player.battingStrikeRate ? Math.min(100, Math.round((player.battingStrikeRate / 150) * 100)) + "%" : "0%"}</span>
                                        </div>
                                        <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                          <div 
                                            className="h-full bg-emerald-400 rounded-full transition-all duration-500" 
                                            style={{ width: `${player.battingStrikeRate ? Math.min(100, (player.battingStrikeRate / 150) * 100) : 0}%` }}
                                          />
                                        </div>
                                     </div>
                                  </div>
                                </div>

                                {/* BOWLING SUB-DOSSIER */}
                                <div className="bg-[#121216]/80 border border-slate-800 rounded p-4 space-y-4">
                                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                                    <div className="flex items-center gap-2">
                                      <Shield className="w-4 h-4 text-sky-400" />
                                      <span className="font-sans font-bold text-white uppercase tracking-wider text-[11px]">BOWLING ROSTER DOSSIER</span>
                                    </div>
                                    <span className="text-[10px] text-sky-400 uppercase font-semibold">Active Metrics</span>
                                  </div>

                                  {isPureBatsman ? (
                                    <div className="h-full min-h-[155px] flex flex-col items-center justify-center text-center p-4 bg-slate-950/45 rounded border border-dashed border-slate-800/40">
                                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Specialist Core Batsman</p>
                                      <p className="text-[9px] text-slate-500 mt-1.5 max-w-xs font-sans leading-relaxed">
                                        This active resource operates as a specialized batsman and close-catcher. Holds zero active bowling spells.
                                      </p>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3.5 gap-x-2">
                                        <div className="space-y-0.5">
                                          <div className="text-[9px] text-slate-500 uppercase tracking-widest">Innings Bowled</div>
                                          <div className="text-white font-bold">{player.bowlingInnings || 0}</div>
                                        </div>
                                        <div className="space-y-0.5">
                                          <div className="text-[9px] text-slate-500 uppercase tracking-widest">Total Wickets</div>
                                          <div className="text-sky-400 font-bold font-mono">{player.wickets || 0}</div>
                                        </div>
                                        <div className="space-y-0.5">
                                          <div className="text-[9px] text-slate-500 uppercase tracking-widest">Economy Rate</div>
                                          <div className="text-white font-bold">{economy > 0 ? economy.toFixed(2) : "0.00"}</div>
                                        </div>
                                        <div className="space-y-0.5">
                                          <div className="text-[9px] text-slate-500 uppercase tracking-widest">Bowling SR</div>
                                          <div className="text-white font-bold">{bowlingStrikeRate > 0 ? bowlingStrikeRate.toFixed(1) : "0.0"}</div>
                                        </div>
                                        <div className="space-y-0.5">
                                          <div className="text-[9px] text-slate-500 uppercase tracking-widest">Best BBI</div>
                                          <div className="text-white font-bold">
                                            {player.bestBowlingWickets > 0 ? (
                                              <span className="text-sky-400 font-semibold font-mono">
                                                {player.bestBowlingWickets}/{player.bestBowlingRuns}
                                              </span>
                                            ) : "—"}
                                          </div>
                                        </div>
                                        <div className="space-y-0.5">
                                          <div className="text-[9px] text-slate-500 uppercase tracking-widest">Workload</div>
                                          <div className="text-white font-bold">
                                            {player.ballsBowled ? (
                                              <>
                                                {(player.ballsBowled / 6).toFixed(1)} <span className="text-slate-500 text-[10px] font-normal">Overs</span>
                                              </>
                                            ) : "0"}
                                          </div>
                                        </div>
                                        <div className="space-y-0.5 col-span-2 sm:col-span-3 pt-1 border-t border-slate-800/40 font-mono">
                                          <div className="text-[9px] text-slate-500 uppercase tracking-widest font-sans">Conceded / balls</div>
                                          <div className="text-slate-300 font-medium text-[11px]">{player.runsConceded || 0} runs from {player.ballsBowled || 0} balls bowled</div>
                                        </div>
                                      </div>
                                      
                                      {/* Progress Bars for Bowling metrics */}
                                      <div className="space-y-2 pt-2 border-t border-slate-800">
                                         <div>
                                           <div className="flex justify-between text-[9px] text-slate-500 uppercase mb-1">
                                             <span>Economy Control (Benchmark 4.0 - Lower is Better)</span>
                                             <span className="text-sky-400 font-bold">
                                               {economy > 0 ? Math.max(0, Math.min(100, Math.round(((10 - economy) / 6) * 100))) + "%" : "0%"}
                                             </span>
                                           </div>
                                           <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                             <div 
                                               className="h-full bg-sky-500 rounded-full transition-all duration-500" 
                                               style={{ width: `${economy > 0 ? Math.max(0, Math.min(100, ((10 - economy) / 6) * 100)) : 0}%` }}
                                             />
                                           </div>
                                         </div>
                                      </div>
                                    </>
                                  )}
                                </div>

                                {/* FIELDING SUB-DOSSIER */}
                                <div className="bg-[#121216]/80 border border-slate-800 rounded p-4 space-y-4">
                                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                                    <div className="flex items-center gap-2">
                                      <Activity className="w-4 h-4 text-amber-500" />
                                      <span className="font-sans font-bold text-white uppercase tracking-wider text-[11px]">FIELDING ROSTER DOSSIER</span>
                                    </div>
                                    <span className="text-[10px] text-amber-500 uppercase font-semibold">Active Metrics</span>
                                  </div>

                                  <div className="grid grid-cols-2 gap-y-3.5 gap-x-2">
                                    <div className="space-y-0.5">
                                      <div className="text-[9px] text-slate-500 uppercase tracking-widest">Catches Taken</div>
                                      <div className="text-emerald-400 font-bold text-sm font-mono">{player.catches || 0}</div>
                                    </div>
                                    <div className="space-y-0.5">
                                      <div className="text-[9px] text-slate-500 uppercase tracking-widest">Stumpings</div>
                                      <div className="text-white font-bold text-sm font-mono">
                                        {player.role === PlayerRole.WicketKeeper ? (
                                          <span className="text-amber-500 font-bold">{player.stumpings || 0}</span>
                                        ) : (
                                          <span className="text-slate-600">—</span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="space-y-0.5 col-span-2 pt-1 border-t border-slate-800/40">
                                      <div className="text-[9px] text-slate-500 uppercase tracking-widest">Primary Fielding Role</div>
                                      <div className="text-slate-300 font-medium text-[11px] font-sans">
                                        {player.role === PlayerRole.WicketKeeper ? "Designated Wicketkeeper (WK)" : "Outfield Specialist (Fielder)"}
                                      </div>
                                    </div>
                                    <div className="space-y-0.5 col-span-2 pt-1 border-t border-slate-800/40">
                                      <div className="text-[9px] text-slate-500 uppercase tracking-widest text-[#94a3b8]/60">Total fielding dismissals</div>
                                      <div className="text-amber-500/90 font-bold text-[12px] font-mono">
                                        {(player.catches || 0) + (player.stumpings || 0)} outs
                                      </div>
                                    </div>
                                  </div>

                                  {/* Fielding Progress Bar/Indicator */}
                                  <div className="space-y-2 pt-3 border-t border-slate-800">
                                     <div>
                                       <div className="flex justify-between text-[9px] text-slate-500 uppercase mb-1">
                                         <span>Fielding Impact Ratio</span>
                                         <span className="text-amber-400 font-bold">
                                           {Math.min(100, Math.round(((player.catches || 0) + (player.stumpings || 0)) * 5))}%
                                         </span>
                                       </div>
                                       <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                         <div 
                                           className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                                           style={{ width: `${Math.min(100, ((player.catches || 0) + (player.stumpings || 0)) * 5)}%` }}
                                         />
                                       </div>
                                     </div>
                                  </div>
                                </div>

                              </div>      </div>
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
 
      {filteredPlayers.length > 0 && (
        <div className="bg-[#16161c] border-t border-slate-800 px-5 py-2.5 text-slate-500 text-[10px] font-mono flex flex-wrap justify-between items-center gap-2">
          <span>SQUAD LISTING: {filteredPlayers.length} / {players.length} INSTANT INDEXED</span>
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="text-emerald-400 font-bold">▲</span> Above Roster Avg
            </span>
            <span className="flex items-center gap-1">
              <span className="text-rose-500 font-bold">▼</span> Below Roster Avg
            </span>
            <span className="text-[9px] text-slate-600">(Hover trend indicators for precise comparison percentages)</span>
          </span>
          <span>HIGH DENSITY REALTIME DEPLOYMENT VALIDATED</span>
        </div>
      )}
    </div>
  );
}
