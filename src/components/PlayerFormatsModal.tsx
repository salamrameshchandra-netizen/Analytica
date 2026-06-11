import { PlayerStats, GameFormat, PlayerRole } from "../types";
import { 
  calculateBattingAverage, 
  calculateBowlingEconomy, 
  calculateBowlingStrikeRate,
  calculateBowlingAverage
} from "../initialData";
import { 
  X, 
  Award, 
  Shield, 
  Zap, 
  Activity, 
  Plus, 
  ChevronRight, 
  Star, 
  BarChart2, 
  Clock, 
  Percent, 
  Sparkles 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getAvatarColorClasses, getDefaultAvatarColor, getDefaultAvatarEmoji } from "./StatsForm";

interface PlayerFormatsModalProps {
  playerName: string;
  allPlayers: PlayerStats[];
  onClose: () => void;
  onAddMissingFormat?: (playerName: string, state: string, role: PlayerRole, format: GameFormat) => void;
}

export default function PlayerFormatsModal({
  playerName,
  allPlayers,
  onClose,
  onAddMissingFormat
}: PlayerFormatsModalProps) {
  // Extract all profiles matching this user name
  const formatProfiles = allPlayers.filter(
    (p) => p.name.trim().toLowerCase() === playerName.trim().toLowerCase()
  );

  // If we can't find any profiles, close gracefully
  if (formatProfiles.length === 0) {
    return null;
  }

  const basePlayer = formatProfiles[0];

  // Map of available format records
  const profileByFormat: Record<string, PlayerStats> = {
    [GameFormat.FC]: formatProfiles.find((p) => p.format === GameFormat.FC)!,
    [GameFormat.ListA]: formatProfiles.find((p) => p.format === GameFormat.ListA)!,
    [GameFormat.T20]: formatProfiles.find((p) => p.format === GameFormat.T20)!
  };

  // Helper values to highlight personal bests
  const getBestMetricValue = (
    extractor: (p: PlayerStats) => number,
    mode: "max" | "min" = "max"
  ) => {
    const validValues = formatProfiles
      .map(extractor)
      .filter((v) => v !== undefined && v !== null && v > 0);
    
    if (validValues.length === 0) return null;
    return mode === "max" ? Math.max(...validValues) : Math.min(...validValues);
  };

  // Extract highest values for highlights
  const bestRuns = getBestMetricValue((p) => p.battingRuns);
  const bestAvg = getBestMetricValue((p) => calculateBattingAverage(p));
  const bestSR = getBestMetricValue((p) => p.battingStrikeRate);
  const bestHs = getBestMetricValue((p) => p.highestScore);
  const bestWickets = getBestMetricValue((p) => p.wickets);
  const bestEcon = getBestMetricValue((p) => calculateBowlingEconomy(p), "min");
  const bestBowSR = getBestMetricValue((p) => calculateBowlingStrikeRate(p), "min");

  // Format cards renderer
  const renderFormatColumn = (format: GameFormat, title: string, colorClass: string) => {
    const p = profileByFormat[format];

    if (!p) {
      // Prompt to create this missing profile
      return (
        <div key={format} className="bg-slate-900/25 border border-slate-800/60 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-4 h-full min-h-[300px]">
          <div className="w-10 h-10 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800 text-slate-600 font-bold font-mono">
            ø
          </div>
          <div className="space-y-1">
            <h5 className="text-xs font-bold text-slate-300 font-mono uppercase">{title}</h5>
            <p className="text-[10px] text-slate-500 max-w-[200px] leading-normal font-sans">
              No stats have been recorded for {basePlayer.name} in this configuration format.
            </p>
          </div>
          {onAddMissingFormat && (
            <button
              onClick={() => onAddMissingFormat(basePlayer.name, basePlayer.state, basePlayer.role, format)}
              className="mt-2 px-3 py-1.5 flex items-center gap-1 bg-slate-900 hover:bg-slate-850 text-[10px] font-bold font-mono text-emerald-400 border border-slate-800 rounded uppercase hover:border-slate-700 transition-all select-none"
            >
              <Plus className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
              Initialize {format === GameFormat.FC ? "FC" : format}
            </button>
          )}
        </div>
      );
    }

    const bAvg = calculateBattingAverage(p);
    const bEcon = calculateBowlingEconomy(p);
    const bSR = calculateBowlingStrikeRate(p);
    const bowAvg = calculateBowlingAverage(p);
    const isPureBatsman = p.role === PlayerRole.Batsman || p.role === PlayerRole.WicketKeeper;

    return (
      <div 
        key={format} 
        className="bg-slate-900/40 border border-slate-850 hover:border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4 transition-all"
      >
        {/* Format Pill and Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${colorClass}`}>
              {title}
            </span>
            <span className="text-[10px] text-slate-500 font-mono block mt-1.5">{p.matches} active matches</span>
          </div>
          <Zap className="w-4 h-4 text-slate-700 shrink-0" />
        </div>

        {/* Batting Section */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-slate-400 font-mono uppercase text-[9px] font-extrabold tracking-wider border-b border-slate-850 pb-1">
            <Award className="w-3 h-3 text-emerald-400" />
            <span>Batting Dossier</span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-500 text-[10px]">Innings (Not Outs)</span>
              <span className="text-slate-300 font-semibold">{p.battingInnings} ({p.notOuts}*)</span>
            </div>

            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-500 text-[10px]">Total Runs</span>
              <span className={`font-bold font-mono text-sm ${p.battingRuns === bestRuns ? "text-amber-400 flex items-center gap-1" : "text-white"}`}>
                {p.battingRuns.toLocaleString()}
                {p.battingRuns === bestRuns && bestRuns > 0 && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
              </span>
            </div>

            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-500 text-[10px]">Batting Average</span>
              <span className={`font-bold p-0.5 rounded text-[11px] ${
                bAvg === bestAvg && bestAvg > 0 
                  ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/10" 
                  : "text-slate-300"
              }`}>
                {bAvg > 0 ? bAvg.toFixed(2) : "0.00"}
              </span>
            </div>

            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-500 text-[10px]">Strike Rate</span>
              <span className={`font-bold ${p.battingStrikeRate === bestSR && bestSR > 0 ? "text-emerald-400" : "text-slate-300"}`}>
                {p.battingStrikeRate > 0 ? p.battingStrikeRate.toFixed(1) : "-"}
              </span>
            </div>

            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-500 text-[10px]">Highest Score</span>
              <span className={`font-bold ${p.highestScore === bestHs && bestHs > 0 ? "text-amber-400" : "text-slate-300"}`}>
                {p.highestScore > 0 ? p.highestScore : "0"}{p.highestScoreNotOut && "*"}
              </span>
            </div>

            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-500 text-[10px]">Centuries / 50s</span>
              <span className="text-slate-300 font-semibold">
                <span className="text-emerald-400">{p.hundreds}</span> ×100 | <span className="text-yellow-400">{p.fiftyPlus}</span> ×50
              </span>
            </div>
            
            <div className="flex justify-between items-center py-0.5 border-t border-slate-850 pt-1.5">
              <span className="text-slate-500 text-[10px]">Boundaries</span>
              <span className="text-slate-400 text-[10px]">
                {p.fours || 0}x4s · {p.sixes || 0}x6s
              </span>
            </div>
          </div>
        </div>

        {/* Bowling Section */}
        <div className="space-y-2.5 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-400 font-mono uppercase text-[9px] font-extrabold tracking-wider border-b border-slate-850 pb-1">
            <Shield className="w-3 h-3 text-sky-400" />
            <span>Bowling Dossier</span>
          </div>

          {isPureBatsman ? (
            <div className="py-6 px-4 bg-slate-950/20 text-center rounded border border-dashed border-slate-805/30">
              <p className="text-[9px] text-slate-500 leading-normal font-sans">
                Specialist gloveman or batsman. No recorded overs bowled in this game format.
              </p>
            </div>
          ) : (
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-500 text-[10px]">Innings Bowled</span>
                <span className="text-slate-300 font-semibold">{p.bowlingInnings || 0}</span>
              </div>

              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-500 text-[10px]">Wickets</span>
                <span className={`font-bold ${p.wickets === bestWickets && bestWickets > 0 ? "text-sky-400 flex items-center gap-1" : "text-white"}`}>
                  {p.wickets || 0}
                  {p.wickets === bestWickets && bestWickets > 0 && <Star className="w-3.5 h-3.5 text-sky-400 fill-sky-400" />}
                </span>
              </div>

              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-500 text-[10px]">Econ Rate</span>
                <span className={`font-bold p-0.5 rounded text-[11px] ${
                  bEcon === bestEcon && bestEcon > 0 
                    ? "bg-sky-950/40 text-sky-400 border border-sky-500/10" 
                    : "text-slate-300"
                }`}>
                  {bEcon > 0 ? bEcon.toFixed(2) : "0.00"}
                </span>
              </div>

              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-500 text-[10px]">Bowling SR</span>
                <span className={`font-bold ${bSR === bestBowSR && bestBowSR > 0 ? "text-sky-400" : "text-slate-300"}`}>
                  {bSR > 0 ? bSR.toFixed(1) : "-"}
                </span>
              </div>

              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-500 text-[10px]">Best BBI</span>
                <span className="text-sky-450 font-bold font-mono">
                  {p.bestBowlingWickets > 0 ? `${p.bestBowlingWickets}/${p.bestBowlingRuns}` : "—"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Fielding Section */}
        <div className="space-y-2.5 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-400 font-mono uppercase text-[9px] font-extrabold tracking-wider border-b border-slate-850 pb-1">
            <Activity className="w-3 h-3 text-amber-500" />
            <span>Fielding metrics</span>
          </div>
          
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-slate-500 text-[10px]">Catches / stumpings</span>
            <span className="text-slate-300 font-semibold">
              <span className="text-emerald-400">{p.catches || 0}</span> catches
              {p.role === PlayerRole.WicketKeeper && (
                <> · <span className="text-amber-500">{p.stumpings || 0}</span> stumpings</>
              )}
            </span>
          </div>
        </div>

      </div>
    );
  };

  const avatarColor = basePlayer.avatarColor || getDefaultAvatarColor(basePlayer.role);
  const avatarEmoji = basePlayer.avatarEmoji || getDefaultAvatarEmoji(basePlayer.role);

  return (
    <div 
      id="player-formats-overlay" 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex justify-center items-center p-4 transition-all animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-[#121216] border border-slate-800 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col relative text-left"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors z-10"
        >
          <X className="w-4.5 h-4.5" />
        </button>

        {/* Top Profile Header */}
        <div className="p-6 md:p-8 bg-[#16161c] border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
          {/* Subtle decoration background glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none -mr-20 -mt-20" />
          
          <div className="flex items-center gap-5 relative z-10">
            {/* Massive Circular Character Avatar */}
            <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center text-2xl shadow-lg select-none shrink-0 ${
              getAvatarColorClasses(avatarColor).bg
            } ${
              getAvatarColorClasses(avatarColor).border
            } ${
              getAvatarColorClasses(avatarColor).text
            }`}>
              {avatarEmoji}
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-white tracking-tight font-sans flex items-center gap-2">
                {basePlayer.name}
                <span className="text-xs font-mono font-normal text-slate-500 font-medium">({basePlayer.state})</span>
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400">
                <span className="px-2 py-0.5 bg-emerald-950/35 border border-emerald-500/25 text-emerald-400 rounded-full text-[10px] font-extrabold uppercase">
                  {basePlayer.role}
                </span>
                <span>·</span>
                <span className="text-slate-500">Cross-format career metrics visual ledger</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 relative z-10">
            <div className="text-right">
              <span className="text-[9px] text-slate-500 font-mono block uppercase">Total Aggregated Appearances</span>
              <span className="text-2xl font-black text-white tracking-tight font-sans">
                {formatProfiles.reduce((acc, current) => acc + current.matches, 0)} Matches
              </span>
            </div>
          </div>
        </div>

        {/* Comparisons layout columns */}
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto">
          {renderFormatColumn(GameFormat.FC, "First-Class (FC)", "bg-emerald-950/30 text-emerald-400 border-emerald-505/20")}
          {renderFormatColumn(GameFormat.ListA, "One-Day (List A)", "bg-indigo-950/30 text-indigo-400 border-indigo-505/20")}
          {renderFormatColumn(GameFormat.T20, "T20 (Short-Form)", "bg-amber-955/30 text-amber-400 border-amber-505/20")}
        </div>

        {/* Footer info strip */}
        <div className="bg-[#16161c] px-6 py-4.5 border-t border-slate-800 text-slate-500 text-[10.5px] font-mono flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Interactive Multi-Format Comparison Matrix</span>
          </div>
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5"><Star className="w-3 h-3 text-amber-400 fill-amber-400" /> Career Highlights</span>
            <span>·</span>
            <span className="text-slate-450 font-semibold">Fully responsive database indices</span>
          </div>
        </div>

      </div>
    </div>
  );
}
