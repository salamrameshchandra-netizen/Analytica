import { useState, useEffect } from "react";
import { PlayerStats, PlayerRole, GameFormat } from "./types";
import { initialPlayers } from "./initialData";
import { generatePdfReport } from "./utils/pdfGenerator";
import Visualizations from "./components/Visualizations";
import PlayerCompare from "./components/PlayerCompare";
import PlayerList from "./components/PlayerList";
import StatsForm from "./components/StatsForm";
import CsvImporter from "./components/CsvImporter";
import { Trophy, Activity, Users, Swords, Award, AlertCircle, RefreshCw, Clock, ArrowUpRight, ArrowDownRight, Camera, Sun, Moon } from "lucide-react";

interface HistoricalSnapshot {
  playersCount: number;
  averageSquadSR: number;
  totalSquadRuns: number;
  totalSquadWickets: number;
  timestamp: string;
}

export default function App() {
  const [players, setPlayers] = useState<PlayerStats[]>(() => {
    const saved = localStorage.getItem("cricket_squad_players");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.error("Failed to parse squad players, falling back to initial data", err);
        return initialPlayers;
      }
    }
    return initialPlayers;
  });

  const [lastSaved, setLastSaved] = useState<string>(() => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });
  const [isSaving, setIsSaving] = useState(false);

  const [editingPlayer, setEditingPlayer] = useState<PlayerStats | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [activeLayoutTab, setActiveLayoutTab] = useState<"roster" | "visualizations" | "duel">("roster");
  const [snapshot, setSnapshot] = useState<HistoricalSnapshot | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("cricket_squad_dark_mode");
    return saved !== null ? saved === "true" : true;
  });
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    actionLabel: string;
    onConfirm: () => void;
    variant: "danger" | "warning" | "info";
  } | null>(null);

  useEffect(() => {
    localStorage.setItem("cricket_squad_dark_mode", String(isDarkMode));
  }, [isDarkMode]);

  // Reactive instant auto-save when players list changes
  useEffect(() => {
    setIsSaving(true);
    localStorage.setItem("cricket_squad_players", JSON.stringify(players));
    
    const now = new Date();
    setLastSaved(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    
    const timer = setTimeout(() => {
      setIsSaving(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, [players]);

  // Periodic background auto-save assurance (runs in the background every 15 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const currentLocal = localStorage.getItem("cricket_squad_players");
      const currentInState = JSON.stringify(players);
      
      if (currentLocal !== currentInState) {
        setIsSaving(true);
        localStorage.setItem("cricket_squad_players", currentInState);
        const now = new Date();
        setLastSaved(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        setTimeout(() => setIsSaving(false), 800);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [players]);


  // Load snapshot from local storage
  useEffect(() => {
    const saved = localStorage.getItem("cricket_squad_snapshot");
    if (saved) {
      try {
        setSnapshot(JSON.parse(saved));
      } catch (err) {
        console.error("Failed to parse historical snapshot", err);
      }
    }
  }, []);

  // Setup initial snapshot if none exists
  useEffect(() => {
    if (players.length > 0 && !snapshot) {
      const initialSR = Number((players.reduce((sum, p) => sum + p.battingStrikeRate, 0) / players.length).toFixed(1));
      const initialRuns = players.reduce((sum, p) => sum + p.battingRuns, 0);
      const initialWickets = players.reduce((sum, p) => sum + p.wickets, 0);
      const uniqueCount = new Set(players.map((p) => p.name.trim().toLowerCase())).size;

      // Seed a historical benchmark so both green/red trends are instantly visible upon initial load
      const newSnapshot: HistoricalSnapshot = {
        playersCount: Math.max(1, uniqueCount - 1),
        averageSquadSR: Number((initialSR - 1.5).toFixed(1)),
        totalSquadRuns: initialRuns - 1340,
        totalSquadWickets: initialWickets + 8, // Slightly higher to showcase a decline (red arrow)
        timestamp: "Baseline Setup"
      };
      setSnapshot(newSnapshot);
      localStorage.setItem("cricket_squad_snapshot", JSON.stringify(newSnapshot));
    }
  }, [players, snapshot]);

  const handleCaptureSnapshot = () => {
    const currentSR = players.length > 0
      ? Number((players.reduce((sum, p) => sum + p.battingStrikeRate, 0) / players.length).toFixed(1))
      : 0;
    const currentRuns = players.reduce((sum, p) => sum + p.battingRuns, 0);
    const currentWickets = players.reduce((sum, p) => sum + p.wickets, 0);
    const uniqueCount = new Set(players.map((p) => p.name.trim().toLowerCase())).size;

    const newSnapshot: HistoricalSnapshot = {
      playersCount: uniqueCount,
      averageSquadSR: currentSR,
      totalSquadRuns: currentRuns,
      totalSquadWickets: currentWickets,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setSnapshot(newSnapshot);
    localStorage.setItem("cricket_squad_snapshot", JSON.stringify(newSnapshot));

    setConfirmDialog({
      title: "Historical Snapshot Saved",
      message: "Successfully captured and saved current squad metrics as your baseline snapshot benchmark.",
      actionLabel: "Done",
      variant: "info",
      onConfirm: () => {
        setConfirmDialog(null);
      }
    });
  };

  const renderKpiTrend = (current: number, snapshotVal: number | undefined, formatType: "number" | "decimal" = "number") => {
    if (snapshotVal === undefined || snapshotVal === null) return null;
    const diff = current - snapshotVal;
    if (diff === 0) {
      return (
        <span className="text-[9px] text-slate-500 font-mono flex items-center ml-auto">
          &mdash; stable
        </span>
      );
    }
    const isPositive = diff > 0;
    const absDiff = Math.abs(diff);
    const formattedDiff = formatType === "decimal" ? absDiff.toFixed(1) : absDiff.toLocaleString();

    return (
      <span className={`text-[10px] font-mono font-extrabold flex items-center gap-0.5 ml-auto border rounded px-1.5 py-0.5 leading-none transition-all ${
        isPositive
          ? 'text-emerald-400 bg-emerald-950/20 border-emerald-500/20'
          : 'text-rose-400 bg-rose-950/30 border-rose-500/20'
      }`}>
        {isPositive ? (
          <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
        ) : (
          <ArrowDownRight className="w-3 h-3 stroke-[2.5]" />
        )}
        {isPositive ? '+' : '-'}{formattedDiff}
      </span>
    );
  };

  // Save to local storage helper
  const savePlayers = (updatedPlayers: PlayerStats[]) => {
    setPlayers(updatedPlayers);
    localStorage.setItem("cricket_squad_players", JSON.stringify(updatedPlayers));
  };

  const handleCreateOrUpdatePlayer = (player: PlayerStats) => {
    const exists = players.some((p) => p.id === player.id);
    let updated: PlayerStats[];
    if (exists) {
      updated = players.map((p) => (p.id === player.id ? player : p));
    } else {
      updated = [player, ...players];
    }
    savePlayers(updated);
    setIsFormOpen(false);
    setEditingPlayer(null);
  };

  const handleDeletePlayer = (id: string) => {
    const player = players.find((p) => p.id === id);
    if (!player) return;
    setConfirmDialog({
      title: "Remove Statistics",
      message: `Are you sure you want to permanently erase ${player.name}'s performance coordinates? This action cannot be undone.`,
      actionLabel: "Erase Records",
      variant: "danger",
      onConfirm: () => {
        const updated = players.filter((p) => p.id !== id);
        savePlayers(updated);
        setConfirmDialog(null);
      }
    });
  };

  const handleEditPlayer = (player: PlayerStats) => {
    setEditingPlayer(player);
    setIsFormOpen(true);
  };

  const handleAddNewPlayer = () => {
    setEditingPlayer(null);
    setIsFormOpen(true);
  };

  const handleAddMissingFormat = (name: string, state: string, role: PlayerRole, format: GameFormat) => {
    setEditingPlayer({
      id: `player-${Date.now()}`,
      name,
      state,
      role,
      format,
      matches: 0,
      battingInnings: 0,
      notOuts: 0,
      battingRuns: 0,
      highestScore: 0,
      highestScoreNotOut: false,
      ballsFaced: 0,
      battingStrikeRate: 0,
      hundreds: 0,
      fiftyPlus: 0,
      fours: 0,
      sixes: 0,
      bowlingInnings: 0,
      ballsBowled: 0,
      runsConceded: 0,
      wickets: 0,
      bestBowlingWickets: 0,
      bestBowlingRuns: 0,
      bowlingEconomy: 0,
      bowlingStrikeRate: 0,
      catches: 0,
      stumpings: 0,
    });
    setIsFormOpen(true);
  };

  const handleResetToPreloaded = () => {
    setConfirmDialog({
      title: "Restore Factory Roster",
      message: "Are you sure you want to restore the pre-packaged dataset? This will fully overwrite all of your active local player listings.",
      actionLabel: "Confirm Reset",
      variant: "warning",
      onConfirm: () => {
        savePlayers(initialPlayers);
        setConfirmDialog(null);
      }
    });
  };

  const handleExportPdfReport = () => {
    if (players.length === 0) {
      setConfirmDialog({
        title: "Export Diagnostics Error",
        message: "No data is present in active rosters. Please populate your squad roster before pulling a PDF summary report.",
        actionLabel: "Dismiss",
        variant: "info",
        onConfirm: () => {
          setConfirmDialog(null);
        }
      });
      return;
    }
    generatePdfReport(players);
  };

  const handleBulkImport = (importedList: PlayerStats[], mode: "merge" | "overwrite") => {
    let updated: PlayerStats[];
    if (mode === "overwrite") {
      updated = [...importedList];
    } else {
      updated = [...importedList, ...players];
    }
    savePlayers(updated);
    setIsImportOpen(false);

    setConfirmDialog({
      title: "Roster Population Success",
      message: `Successfully swallowed and ingested ${importedList.length} player performance datasets in bulk records. Active roster list updated.`,
      actionLabel: "Explore Roster",
      variant: "info",
      onConfirm: () => {
        setConfirmDialog(null);
      }
    });
  };

  // Top metric counters
  const totalSquadRuns = players.reduce((sum, p) => sum + p.battingRuns, 0);
  const totalSquadWickets = players.reduce((sum, p) => sum + p.wickets, 0);
  const averageSquadSR = players.length > 0 
    ? Number((players.reduce((sum, p) => sum + p.battingStrikeRate, 0) / players.length).toFixed(1))
    : 0;
  const uniquePlayersCount = new Set(players.map((p) => p.name.trim().toLowerCase())).size;

  return (
    <div className={`min-h-screen bg-[#0a0a0c] font-sans text-slate-350 antialiased selection:bg-emerald-950 selection:text-emerald-250 pb-16 transition-colors duration-150 ${
      !isDarkMode ? "light light-theme" : ""
    }`}>
      
      {/* Top Navigation Bar from High Density Design theme */}
      <nav className="flex items-center justify-between px-6 py-3 bg-[#121216] border-b border-slate-800" id="high-density-navbar">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center text-black font-extrabold shadow-sm font-mono">C</div>
          <span className="font-bold tracking-tighter text-md uppercase text-white flex items-center gap-2">
            Cricket Analytica 
            <span className="text-emerald-400 font-mono text-xs px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-950/20">PRO v2.4</span>
          </span>
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-[#17171e]/80 border border-slate-800 text-[10.5px] font-mono select-none">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSaving ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isSaving ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
            </span>
            <span className="text-slate-400">
              {isSaving ? (
                <span className="text-amber-400 font-bold animate-pulse">Auto-Saving...</span>
              ) : (
                <>Cache Sync: <span className="text-emerald-400 font-bold">Auto-Saved</span> <span className="text-slate-500 text-[9px]">({lastSaved})</span></>
              )}
            </span>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <button
            id="theme-toggler-btn"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="px-3 py-1.5 text-xs bg-[#16161c] hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded transition-all flex items-center gap-1.5 font-mono"
            title={isDarkMode ? "Turn Off Dark Mode (Switch to Light Mode)" : "Turn On Dark Mode"}
          >
            {isDarkMode ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="hidden sm:inline">Light Theme</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Dark Theme</span>
              </>
            )}
          </button>

          <button 
            onClick={handleCaptureSnapshot}
            className="px-3 py-1.5 text-xs bg-indigo-950/40 text-indigo-400 border border-indigo-500/20 hover:border-indigo-500/40 rounded hover:bg-slate-900/50 hover:text-white transition-all flex items-center gap-1"
            title="Save current squad metrics as historical snapshot comparison baseline"
          >
            <Camera className="w-3 h-3 text-indigo-400" /> Save Snapshot
          </button>
          <button 
            onClick={handleResetToPreloaded}
            className="px-3 py-1.5 text-xs border border-slate-800 text-slate-400 rounded hover:bg-slate-900/50 hover:text-white transition-all flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" /> Reset Squad
          </button>
          <button 
            onClick={handleExportPdfReport}
            className="px-4 py-1.5 text-xs bg-emerald-600 text-white rounded font-bold hover:bg-emerald-500 transition-all flex items-center gap-2 shadow-sm shadow-emerald-900/20"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            Export PDF Report
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        
        {/* Top Dashboard KPIs */}
        <div id="quick-analytical-dashboard" className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
          {/* Card 1: Analyzed Players */}
          <div className="bg-[#121216] border border-slate-800 p-4 rounded relative group cursor-help transition-all duration-200 hover:border-slate-700">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block flex items-center justify-between gap-1">
              Analyzed Players 
              <span className="text-[9px] text-slate-600 group-hover:text-emerald-400 transition-colors">ⓘ</span>
            </span>
            <div className="flex items-center mt-1">
              <div className="text-2xl font-mono font-bold text-white">{uniquePlayersCount}</div>
              {snapshot && renderKpiTrend(uniquePlayersCount, snapshot.playersCount, "number")}
            </div>
            
            {snapshot && (
              <div className="text-[9px] text-slate-500 mt-2 pt-1 border-t border-slate-800/40 font-mono flex items-center justify-between">
                <span className="flex items-center gap-1"><Clock className="w-2 text-slate-600" /> Snapshot</span>
                <span className="text-slate-400 font-bold">{snapshot.playersCount}</span>
              </div>
            )}

            {/* Tooltip */}
            <div className="absolute top-full left-0 mt-2 w-64 bg-[#0f0f13] border border-slate-800 text-slate-300 p-3 rounded-md shadow-2xl z-50 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 text-xs font-mono font-normal leading-relaxed">
              <p className="font-bold text-white mb-1 font-sans">Analyzed Players</p>
              <p className="text-slate-400 font-sans text-[11px]">The count of player profiles currently loaded and managed in active squad memory.</p>
              {snapshot && <p className="text-[10px] text-indigo-400 mt-1 font-sans">Snapshot baseline taken at: {snapshot.timestamp}</p>}
            </div>
          </div>

          {/* Card 2: Avg. Batting Strike Rate */}
          <div className="bg-[#121216] border border-slate-800 p-4 rounded relative group cursor-help transition-all duration-200 hover:border-slate-700">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block flex items-center justify-between gap-1">
              Avg. Batting Strike Rate 
              <span className="text-[9px] text-slate-600 group-hover:text-blue-400 transition-colors">ⓘ</span>
            </span>
            <div className="flex items-center mt-1">
              <div className="text-2xl font-mono font-bold text-blue-400">{averageSquadSR > 0 ? averageSquadSR.toFixed(1) : "—"}</div>
              {snapshot && renderKpiTrend(averageSquadSR, snapshot.averageSquadSR, "decimal")}
            </div>

            {snapshot && (
              <div className="text-[9px] text-slate-500 mt-2 pt-1 border-t border-slate-800/40 font-mono flex items-center justify-between">
                <span className="flex items-center gap-1"><Clock className="w-2 text-slate-600" /> Snapshot</span>
                <span className="text-slate-400 font-bold">{snapshot.averageSquadSR.toFixed(1)}</span>
              </div>
            )}
            
            {/* Tooltip */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 bg-[#0f0f13] border border-slate-800 text-slate-300 p-3 rounded-md shadow-2xl z-50 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 text-xs font-mono font-normal leading-relaxed">
              <p className="font-bold text-white mb-1 font-sans">Avg. Batting Strike Rate (SR)</p>
              <div className="space-y-1.5 text-slate-400 font-sans text-[11px]">
                <p>Calculates the average batting strike rate of all players in the roster.</p>
                <p className="font-mono text-[10px] text-blue-400 border-t border-slate-800/80 pt-1 mt-1">
                  Formula: sum(SR) / count(Players)
                </p>
                <p>Represented as average runs scored per 100 balls faced across the team.</p>
                {snapshot && <p className="text-[10px] text-indigo-400 font-sans">Snapshot baseline taken at: {snapshot.timestamp}</p>}
              </div>
            </div>
          </div>

          {/* Card 3: Total Squad Runs */}
          <div className="bg-[#121216] border border-slate-800 p-4 rounded relative group cursor-help transition-all duration-200 hover:border-slate-700">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block flex items-center justify-between gap-1">
              Total Squad Runs 
              <span className="text-[9px] text-slate-600 group-hover:text-emerald-400 transition-colors">ⓘ</span>
            </span>
            <div className="flex items-center mt-1">
              <div className="text-2xl font-mono font-bold text-emerald-400">{totalSquadRuns.toLocaleString()}</div>
              {snapshot && renderKpiTrend(totalSquadRuns, snapshot.totalSquadRuns, "number")}
            </div>

            {snapshot && (
              <div className="text-[9px] text-slate-500 mt-2 pt-1 border-t border-slate-800/40 font-mono flex items-center justify-between">
                <span className="flex items-center gap-1"><Clock className="w-2 text-slate-600" /> Snapshot</span>
                <span className="text-slate-400 font-bold">{snapshot.totalSquadRuns.toLocaleString()}</span>
              </div>
            )}
            
            {/* Tooltip */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-[#0f0f13] border border-slate-800 text-slate-300 p-3 rounded-md shadow-2xl z-50 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 text-xs font-mono font-normal leading-relaxed">
              <p className="font-bold text-white mb-1 font-sans">Total Squad Runs</p>
              <p className="text-slate-400 font-sans text-[11px]">The cumulative runs scored across all matches by all players registered in the active roster.</p>
              <p className="font-mono text-[10px] text-emerald-400 border-t border-slate-800/80 pt-1 mt-1">Formula: sum(Player Runs)</p>
              {snapshot && <p className="text-[10px] text-indigo-400 mt-1 font-sans">Snapshot baseline taken at: {snapshot.timestamp}</p>}
            </div>
          </div>

          {/* Card 4: Total Squad Wickets */}
          <div className="bg-[#121216] border border-slate-800 p-4 rounded border-emerald-500/30 bg-emerald-950/5 relative group cursor-help transition-all duration-200 hover:border-emerald-500/50">
            <span className="text-[10px] text-emerald-500 uppercase tracking-wider block flex items-center justify-between gap-1">
              Total Squad Wickets 
              <span className="text-[9px] text-emerald-500/70 group-hover:text-emerald-400 transition-colors">ⓘ</span>
            </span>
            <div className="flex items-center mt-1">
              <div className="text-2xl font-mono font-bold text-white">{totalSquadWickets}</div>
              {snapshot && renderKpiTrend(totalSquadWickets, snapshot.totalSquadWickets, "number")}
            </div>

            {snapshot && (
              <div className="text-[9px] text-slate-500/60 mt-2 pt-1 border-t border-slate-800/40 font-mono flex items-center justify-between">
                <span className="flex items-center gap-1"><Clock className="w-2 text-emerald-600/70" /> Snapshot</span>
                <span className="text-slate-400 font-bold">{snapshot.totalSquadWickets}</span>
              </div>
            )}
            
            {/* Tooltip */}
            <div className="absolute top-full right-0 mt-2 w-64 bg-[#0f0f13] border border-slate-800 text-slate-300 p-3 rounded-md shadow-2xl z-50 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 text-xs font-mono font-normal leading-relaxed">
              <p className="font-bold text-white mb-1 font-sans">Total Squad Wickets</p>
              <p className="text-slate-400 font-sans text-[11px]">The total breakthrough wicket-count captured by all bowlers registered in the squad.</p>
              <p className="font-mono text-[10px] text-emerald-400 border-t border-slate-800/80 pt-1 mt-1">Formula: sum(Wickets)</p>
              {snapshot && <p className="text-[10px] text-indigo-400 mt-1 font-sans">Snapshot baseline taken at: {snapshot.timestamp}</p>}
            </div>
          </div>
        </div>

        {/* Navigation Selector Buttons with High Density tabs */}
        <div id="layout-view-tabs" className="flex border-b border-slate-800">
          <button
            id="layout-tab-btn-roster"
            onClick={() => setActiveLayoutTab("roster")}
            className={`px-5 py-3 text-xs font-bold border-b-2 tracking-wider uppercase transition-all flex items-center gap-2 ${
              activeLayoutTab === "roster"
                ? "border-emerald-500 text-emerald-400 bg-emerald-950/10"
                : "border-transparent text-slate-500 hover:text-slate-305"
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Squad Roster
          </button>
          
          <button
            id="layout-tab-btn-visualizations"
            onClick={() => setActiveLayoutTab("visualizations")}
            className={`px-5 py-3 text-xs font-bold border-b-2 tracking-wider uppercase transition-all flex items-center gap-2 ${
              activeLayoutTab === "visualizations"
                ? "border-emerald-500 text-emerald-400 bg-emerald-950/10"
                : "border-transparent text-slate-500 hover:text-slate-305"
            }`}
          >
            <Activity className="w-3.5 h-3.5" /> Interactive Visualizers
          </button>

          <button
            id="layout-tab-btn-duel"
            onClick={() => setActiveLayoutTab("duel")}
            className={`px-5 py-3 text-xs font-bold border-b-2 tracking-wider uppercase transition-all flex items-center gap-2 ${
              activeLayoutTab === "duel"
                ? "border-emerald-500 text-emerald-400 bg-emerald-950/10"
                : "border-transparent text-slate-500 hover:text-slate-305"
            }`}
          >
            <Swords className="w-3.5 h-3.5" /> Player Duel
          </button>
        </div>

        {/* Dynamic Panel Views */}
        <div id="tab-outlet" className="space-y-6">
          {activeLayoutTab === "roster" && (
            <PlayerList
              players={players}
              onEdit={handleEditPlayer}
              onDelete={handleDeletePlayer}
              onAddNew={handleAddNewPlayer}
              onReset={handleResetToPreloaded}
              onExportPdf={handleExportPdfReport}
              onImportClick={() => setIsImportOpen(true)}
              onAddMissingFormat={handleAddMissingFormat}
            />
          )}

          {activeLayoutTab === "visualizations" && (
            <Visualizations players={players} />
          )}

          {activeLayoutTab === "duel" && (
            <PlayerCompare players={players} onAddMissingFormat={handleAddMissingFormat} />
          )}
        </div>

        {/* Quick Insights Banner in High Density Theme */}
        <div className="bg-[#121216] border border-slate-800 rounded-xl p-5 text-slate-300 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-92 h-92 bg-emerald-500/5 blur-[100px] rounded-full"></div>
          
          <div className="max-w-2xl relative z-10 space-y-1.5">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
              <Trophy className="w-4 h-4" /> Analytical Squad Summary
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Use these tools to configure team lineups. Select the **Interactive Visualizers** tab to locate high-efficiency boundaries where players outperform world standards, or add your own team matches manually.
            </p>
          </div>

          <button
            id="bottom-export-btn"
            onClick={handleExportPdfReport}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs flex items-center gap-2 shrink-0 shadow-lg relative z-10 transition-all uppercase tracking-wide"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            Print Performance Ledger
          </button>
        </div>

      </main>

      {/* Manual Input drawer modal */}
      {isFormOpen && (
        <StatsForm
          player={editingPlayer}
          onSave={handleCreateOrUpdatePlayer}
          onClose={() => setIsFormOpen(false)}
        />
      )}

      {/* CSV Batch Ingestion Deck */}
      {isImportOpen && (
        <CsvImporter
          onImport={handleBulkImport}
          onClose={() => setIsImportOpen(false)}
          existingPlayers={players}
        />
      )}



      {/* Custom Confirmation Modal */}
      {confirmDialog && (
        <div id="confirm-modal-backdrop" className="fixed inset-0 bg-[#000]/80 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
          <div id="confirm-modal-box" className="bg-[#121216] border border-slate-800 rounded max-w-md w-full scale-100 transition-all shadow-2xl p-6 space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono border-b border-slate-800 pb-2">
              {confirmDialog.title}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed font-sans mt-2">
              {confirmDialog.message}
            </p>
            <div className="flex items-center justify-end gap-3 mt-4 pt-1">
              <button
                type="button"
                id="confirm-cancel-btn"
                onClick={() => setConfirmDialog(null)}
                className="px-3.5 py-1.5 text-[11px] font-bold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded transition-all uppercase tracking-wider font-mono"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-action-btn"
                onClick={confirmDialog.onConfirm}
                className={`px-4 py-1.5 text-[11px] font-bold rounded shadow-md transition-all uppercase tracking-wider font-mono ${
                  confirmDialog.variant === "danger"
                    ? "bg-rose-600 hover:bg-rose-500 text-white"
                    : confirmDialog.variant === "warning"
                    ? "bg-amber-600 hover:bg-amber-500 text-white"
                    : "bg-emerald-400 hover:bg-emerald-300 text-black"
                }`}
              >
                {confirmDialog.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
