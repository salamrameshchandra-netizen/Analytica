import { useState, useEffect, FormEvent } from "react";
import { PlayerStats, PlayerRole, GameFormat } from "../types";
import { X, Save, AlertCircle, RefreshCw, Sparkles } from "lucide-react";

interface StatsFormProps {
  player: PlayerStats | null; // If null, we are in "Create" mode, otherwise "Edit" mode
  onSave: (player: PlayerStats) => void;
  onClose: () => void;
}

export const getDefaultAvatarEmoji = (role: PlayerRole): string => {
  switch (role) {
    case PlayerRole.Batsman: return "🏏";
    case PlayerRole.Bowler: return "🥎";
    case PlayerRole.AllRounder: return "⚡";
    case PlayerRole.WicketKeeper: return "🧤";
    default: return "🧢";
  }
};

export const getDefaultAvatarColor = (role: PlayerRole): string => {
  switch (role) {
    case PlayerRole.Batsman: return "emerald";
    case PlayerRole.Bowler: return "rose";
    case PlayerRole.AllRounder: return "amber";
    case PlayerRole.WicketKeeper: return "sky";
    default: return "slate";
  }
};

export const getAvatarColorClasses = (color: string) => {
  switch (color) {
    case "emerald":
      return {
        bg: "bg-emerald-950/40",
        border: "border-emerald-500/30",
        text: "text-emerald-400",
        ring: "ring-emerald-500/20"
      };
    case "rose":
      return {
        bg: "bg-rose-950/40",
        border: "border-rose-500/30",
        text: "text-rose-400",
        ring: "ring-rose-500/20"
      };
    case "amber":
      return {
        bg: "bg-amber-950/40",
        border: "border-amber-500/30",
        text: "text-amber-400",
        ring: "ring-amber-500/20"
      };
    case "sky":
      return {
        bg: "bg-sky-950/40",
        border: "border-sky-500/30",
        text: "text-sky-400",
        ring: "ring-sky-500/20"
      };
    case "violet":
      return {
        bg: "bg-indigo-950/40",
        border: "border-indigo-500/30",
        text: "text-indigo-400",
        ring: "ring-indigo-500/20"
      };
    case "slate":
    default:
      return {
        bg: "bg-slate-900",
        border: "border-slate-800",
        text: "text-slate-400",
        ring: "ring-slate-800"
      };
  }
};

export default function StatsForm({ player, onSave, onClose }: StatsFormProps) {
  // Common details
  const [name, setName] = useState("");
  const [stateName, setStateName] = useState("");
  const [role, setRole] = useState<PlayerRole>(PlayerRole.Batsman);
  const [format, setFormat] = useState<GameFormat>(GameFormat.FC);
  const [matches, setMatches] = useState(0);

  // Avatar states
  const [avatarEmoji, setAvatarEmoji] = useState("🏏");
  const [avatarColor, setAvatarColor] = useState("emerald");
  const [hasManuallyEditedAvatar, setHasManuallyEditedAvatar] = useState(false);

  // Batting state
  const [battingInnings, setBattingInnings] = useState(0);
  const [notOuts, setNotOuts] = useState(0);
  const [battingRuns, setBattingRuns] = useState(0);
  const [highestScore, setHighestScore] = useState(0);
  const [highestScoreNotOut, setHighestScoreNotOut] = useState(false);
  const [ballsFaced, setBallsFaced] = useState(0);
  const [battingStrikeRate, setBattingStrikeRate] = useState(0);
  const [hundreds, setHundreds] = useState(0);
  const [fiftyPlus, setFiftyPlus] = useState(0);
  const [fours, setFours] = useState(0);
  const [sixes, setSixes] = useState(0);

  // Bowling state
  const [bowlingInnings, setBowlingInnings] = useState(0);
  const [oversBowled, setOversBowled] = useState(0); // For user ease of typing
  const [runsConceded, setRunsConceded] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [bestBowlingWickets, setBestBowlingWickets] = useState(0);
  const [bestBowlingRuns, setBestBowlingRuns] = useState(0);
  
  // Fielding state
  const [catches, setCatches] = useState(0);
  const [stumpings, setStumpings] = useState(0);
  
  // Custom states that can be auto-calculated but also manually overridden
  const [bowlingEconomy, setBowlingEconomy] = useState(0);
  const [bowlingStrikeRate, setBowlingStrikeRate] = useState(0);

  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  const isPureBatsman = role === PlayerRole.Batsman || role === PlayerRole.WicketKeeper;

  // Auto-calculate Batting Strike Rate in real-time
  useEffect(() => {
    if (ballsFaced > 0) {
      setBattingStrikeRate(Number(((battingRuns / ballsFaced) * 100).toFixed(2)));
    } else {
      setBattingStrikeRate(0);
    }
  }, [battingRuns, ballsFaced]);

  // Auto-calculate Bowling Economy and Strike Rate in real-time
  useEffect(() => {
    const balls = Math.round(oversBowled * 6);
    if (balls > 0) {
      setBowlingEconomy(Number((runsConceded / (balls / 6)).toFixed(2)));
    } else {
      setBowlingEconomy(0);
    }

    if (wickets > 0) {
      setBowlingStrikeRate(Number((balls / wickets).toFixed(2)));
    } else {
      setBowlingStrikeRate(0);
    }
  }, [oversBowled, runsConceded, wickets]);

  // Load player if in "Edit" mode
  useEffect(() => {
    if (player) {
      setName(player.name);
      setStateName(player.state);
      setRole(player.role);
      setFormat(player.format || GameFormat.FC);
      setMatches(player.matches);
      
      // Batting
      setBattingInnings(player.battingInnings);
      setNotOuts(player.notOuts);
      setBattingRuns(player.battingRuns);
      setHighestScore(player.highestScore);
      setHighestScoreNotOut(player.highestScoreNotOut);
      setBallsFaced(player.ballsFaced || (player.battingRuns && player.battingStrikeRate ? Math.round((player.battingRuns / player.battingStrikeRate) * 100) : 0));
      setBattingStrikeRate(player.battingStrikeRate);
      setHundreds(player.hundreds);
      setFiftyPlus(player.fiftyPlus);
      setFours(player.fours || 0);
      setSixes(player.sixes || 0);

      // Bowling
      setBowlingInnings(player.bowlingInnings);
      // overs = balls / 6
      setOversBowled(Number((player.ballsBowled / 6).toFixed(1)));
      setRunsConceded(player.runsConceded);
      setWickets(player.wickets);
      setBestBowlingWickets(player.bestBowlingWickets);
      setBestBowlingRuns(player.bestBowlingRuns);
      setBowlingEconomy(player.bowlingEconomy);
      setBowlingStrikeRate(player.bowlingStrikeRate);

      // Fielding
      setCatches(player.catches || 0);
      setStumpings(player.stumpings || 0);

      // Avatar
      setAvatarEmoji(player.avatarEmoji || getDefaultAvatarEmoji(player.role));
      setAvatarColor(player.avatarColor || getDefaultAvatarColor(player.role));
      setHasManuallyEditedAvatar(!!player.avatarEmoji || !!player.avatarColor);
    } else {
      // Clear values for new player
      setName("");
      setStateName("");
      setRole(PlayerRole.Batsman);
      setFormat(GameFormat.FC);
      setMatches(0);
      setBattingInnings(0);
      setNotOuts(0);
      setBattingRuns(0);
      setHighestScore(0);
      setHighestScoreNotOut(false);
      setBallsFaced(0);
      setBattingStrikeRate(0);
      setHundreds(0);
      setFiftyPlus(0);
      setFours(0);
      setSixes(0);
      setBowlingInnings(0);
      setOversBowled(0);
      setRunsConceded(0);
      setWickets(0);
      setBestBowlingWickets(0);
      setBestBowlingRuns(0);
      setBowlingEconomy(0);
      setBowlingStrikeRate(0);
      setCatches(0);
      setStumpings(0);
      setAvatarEmoji("🏏");
      setAvatarColor("emerald");
      setHasManuallyEditedAvatar(false);
    }
  }, [player]);

  // Recalculate billing values when balls/runs/wickets change
  const handleAutoCalcBowling = () => {
    const balls = Math.round(oversBowled * 6);
    
    // Economy
    if (balls > 0) {
      const calcEco = (runsConceded / (balls / 6));
      setBowlingEconomy(Number(calcEco.toFixed(2)));
    } else {
      setBowlingEconomy(0);
    }

    // Strike Rate
    if (wickets > 0) {
      const calcSREcon = (balls / wickets);
      setBowlingStrikeRate(Number(calcSREcon.toFixed(2)));
    } else {
      setBowlingStrikeRate(0);
    }
  };

  const validateAndSubmit = (e: FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];

    // Validations
    if (!name.trim()) errors.push("Player Name is required.");
    if (!stateName.trim()) errors.push("State/Team belongs to is required.");
    if (matches < 0) errors.push("Matches cannot be negative.");
    
    // Batting validation
    const maxBattingInnings = format === GameFormat.FC ? matches * 2 : matches;
    if (battingInnings > maxBattingInnings) {
      errors.push(
        format === GameFormat.FC
          ? `Batting Innings can be at most 2x total Matches played (${maxBattingInnings}) for First-Class (FC) matches.`
          : "Batting Innings cannot exceed total Matches played."
      );
    }
    if (notOuts > battingInnings) {
      errors.push("Not Outs cannot exceed Batting Innings.");
    }
    if (hundreds + fiftyPlus > battingInnings) {
      errors.push("Total 100s + 50s cannot exceed Batting Innings.");
    }

    // Bowling validation
    const maxBowlingInnings = format === GameFormat.FC ? matches * 2 : matches;
    if (bowlingInnings > maxBowlingInnings) {
      errors.push(
        format === GameFormat.FC
          ? `Bowling Innings can be at most 2x total Matches played (${maxBowlingInnings}) for First-Class (FC) matches.`
          : "Bowling Innings cannot exceed total Matches played."
      );
    }
    if (bestBowlingWickets > 10) {
      errors.push("Best wickets in an innings can represent at most 10 wickets.");
    }

    if (fours < 0) errors.push("Fours (4s) cannot be negative.");
    if (sixes < 0) errors.push("Sixes (6s) cannot be negative.");
    if (catches < 0) errors.push("Catches cannot be negative.");
    if (stumpings < 0) errors.push("Stumpings cannot be negative.");
    if ((fours * 4 + sixes * 6) > battingRuns) {
      errors.push(`Boundary runs from 4s and 6s (${fours * 4 + sixes * 6} runs) cannot exceed Total Runs Scored (${battingRuns} runs).`);
    }

    if (errors.length > 0) {
      setErrorMessages(errors);
      // Flow up to errors div
      const errDiv = document.getElementById("form-errors");
      if (errDiv) {
        errDiv.scrollIntoView({ behavior: "smooth" });
      }
      return;
    }

    // Prepare compiled object
    const finalPlayer: PlayerStats = {
      id: player?.id || `player-${Date.now()}`,
      name: name.trim(),
      state: stateName.trim(),
      role,
      format,
      matches: Number(matches),
      
      // Batting
      battingInnings: Number(battingInnings),
      notOuts: Number(notOuts),
      battingRuns: Number(battingRuns),
      highestScore: Number(highestScore),
      highestScoreNotOut,
      ballsFaced: Number(ballsFaced),
      battingStrikeRate: Number(battingStrikeRate),
      hundreds: Number(hundreds),
      fiftyPlus: Number(fiftyPlus),
      fours: Number(fours),
      sixes: Number(sixes),
      
      // Bowling (overs converted back to balls)
      bowlingInnings: Number(bowlingInnings),
      ballsBowled: Math.round(Number(oversBowled) * 6),
      runsConceded: Number(runsConceded),
      wickets: Number(wickets),
      bestBowlingWickets: Number(bestBowlingWickets),
      bestBowlingRuns: Number(bestBowlingRuns),
      bowlingEconomy: Number(bowlingEconomy),
      bowlingStrikeRate: Number(bowlingStrikeRate),

      // Fielding
      catches: Number(catches),
      stumpings: Number(stumpings),

      // Custom visual configurations
      avatarEmoji,
      avatarColor
    };

    onSave(finalPlayer);
  };

  return (
    <div id="stats-form-backdrop" className="fixed inset-0 bg-[#000]/75 backdrop-blur-sm z-50 flex justify-center items-start overflow-y-auto p-4 sm:p-6 md:p-10">
      <div id="stats-form-card" className="bg-[#121216] rounded w-full max-w-4xl shadow-2xl relative my-auto border border-slate-800 flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#16161c] border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              {player ? `INDEX EDIT: ${player.name}` : "ADD CRICKET PLAYER STATISTICS"}
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-mono">Input precise batting and bowling performance coordinates</p>
          </div>
          <button 
            id="close-form-btn" 
            onClick={onClose} 
            className="p-1 rounded bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={validateAndSubmit} className="overflow-y-auto p-6 space-y-6">
          
          {/* Validation Errors list */}
          {errorMessages.length > 0 && (
            <div id="form-errors" className="bg-rose-950/20 border border-rose-900/30 p-4 rounded flex gap-3 text-rose-300 text-xs font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <div>
                <p className="font-bold mb-1 text-rose-400 uppercase font-mono">VALIDATION THRESHOLD FAILED:</p>
                <ul className="list-disc pl-4 space-y-1">
                  {errorMessages.map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Section A: Primary Info */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest border-b border-slate-800/80 pb-1 font-mono">1. Professional Credentials</h4>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase font-mono mb-1">Player Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Virat Kohli"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded focus:border-emerald-500 text-xs text-white placeholder-slate-600 font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase font-mono mb-1">State / Team *</label>
                <input
                  type="text"
                  required
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  placeholder="e.g. Delhi"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded focus:border-emerald-500 text-xs text-white placeholder-slate-600 font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase font-mono mb-1">Primary Role</label>
                <select
                  value={role}
                  onChange={(e) => {
                    const nextRole = e.target.value as PlayerRole;
                    setRole(nextRole);
                    if (!hasManuallyEditedAvatar) {
                      setAvatarEmoji(getDefaultAvatarEmoji(nextRole));
                      setAvatarColor(getDefaultAvatarColor(nextRole));
                    }
                  }}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded focus:border-emerald-500 text-xs text-slate-300 font-mono outline-none"
                >
                  <option value={PlayerRole.Batsman} className="bg-[#121216]">Batsman</option>
                  <option value={PlayerRole.Bowler} className="bg-[#121216]">Bowler</option>
                  <option value={PlayerRole.AllRounder} className="bg-[#121216]">All-rounder</option>
                  <option value={PlayerRole.WicketKeeper} className="bg-[#121216]">Wicketkeeper-Batsman</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase font-mono mb-1">Match Format *</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as GameFormat)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded focus:border-emerald-500 text-xs text-slate-300 font-mono outline-none"
                >
                  <option value={GameFormat.FC} className="bg-[#121216]">First-Class (FC)</option>
                  <option value={GameFormat.ListA} className="bg-[#121216]">List A</option>
                  <option value={GameFormat.T20} className="bg-[#121216]">T20</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase font-mono mb-1">Matches Played</label>
                <input
                  type="number"
                  min="0"
                  value={matches || ""}
                  onChange={(e) => setMatches(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded focus:border-emerald-500 text-xs text-white font-mono outline-none"
                />
              </div>
            </div>

            {/* Avatar customization tools */}
            <div className="p-4 bg-slate-900/35 border border-slate-800 rounded-lg flex flex-col md:flex-row items-center gap-6 mt-4">
              <div className="flex-shrink-0 text-center space-y-1.5">
                <div className="text-[10px] uppercase font-bold text-slate-500 font-mono">Avatar Preview</div>
                <div className={`w-14 h-14 rounded-full border flex items-center justify-center text-2xl transition-all shadow-inner ${getAvatarColorClasses(avatarColor).bg} ${getAvatarColorClasses(avatarColor).border} ${getAvatarColorClasses(avatarColor).text} ring-4 ${getAvatarColorClasses(avatarColor).ring}`}>
                  {avatarEmoji}
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-grow">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase font-mono mb-1">Select Avatar Icon / Emoji</label>
                  <div className="flex flex-wrap gap-1.5 p-2 bg-slate-900 border border-slate-800 rounded max-h-24 overflow-y-auto">
                    {["🏏", "🥎", "🧤", "⚡", "🏆", "🧢", "⭐", "👑", "🔥", "🦁", "🎯", "🛡️"].map((sym) => (
                      <button
                        key={sym}
                        type="button"
                        onClick={() => {
                          setAvatarEmoji(sym);
                          setHasManuallyEditedAvatar(true);
                        }}
                        className={`w-7 h-7 flex items-center justify-center text-sm rounded transition-all ${
                          avatarEmoji === sym 
                            ? "bg-emerald-500/20 text-white border border-emerald-400" 
                            : "hover:bg-slate-850 text-slate-400 border border-transparent"
                        }`}
                      >
                        {sym}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase font-mono mb-1">Select Accent Frame Color</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { key: "emerald", label: "Emerald", color: "text-emerald-400", dot: "bg-emerald-400" },
                      { key: "rose", label: "Rose", color: "text-rose-400", dot: "bg-rose-400" },
                      { key: "amber", label: "Amber", color: "text-amber-400", dot: "bg-amber-400" },
                      { key: "sky", label: "Sky", color: "text-sky-400", dot: "bg-sky-400" },
                      { key: "violet", label: "Violet", color: "text-indigo-400", dot: "bg-indigo-400" },
                      { key: "slate", label: "Slate", color: "text-slate-400", dot: "bg-slate-400" }
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => {
                          setAvatarColor(item.key);
                          setHasManuallyEditedAvatar(true);
                        }}
                        className={`px-2 py-1.5 text-[10px] font-mono rounded flex items-center gap-1.5 border transition-all ${
                          avatarColor === item.key 
                            ? "bg-slate-800 border-slate-600 text-white" 
                            : "bg-slate-900 border-slate-850 text-slate-400 hover:bg-slate-850"
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${item.dot}`} />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section B: Batting Core Stats */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest border-b border-slate-800/80 pb-1 font-mono">2. Batting Career Statistics</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase font-mono mb-1">Innings Batted</label>
                <input
                  type="number"
                  min="0"
                  value={battingInnings || ""}
                  onChange={(e) => setBattingInnings(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded focus:border-emerald-500 text-xs text-white font-mono outline-none"
                />
                {format === GameFormat.FC && (
                  <span className="text-[10px] text-emerald-400 font-mono mt-1 block">FC allows up to 2 innings / match</span>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase font-mono mb-1">Not Outs</label>
                <input
                  type="number"
                  min="0"
                  value={notOuts || ""}
                  onChange={(e) => setNotOuts(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded focus:border-emerald-500 text-xs text-white font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase font-mono mb-1">Runs Scored</label>
                <input
                  type="number"
                  min="0"
                  value={battingRuns || ""}
                  onChange={(e) => setBattingRuns(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded focus:border-emerald-550 text-xs text-white font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase font-mono mb-1">Highest Score</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min="0"
                    placeholder="Runs"
                    value={highestScore || ""}
                    onChange={(e) => setHighestScore(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded focus:border-emerald-500 text-xs text-white font-mono outline-none"
                  />
                  <label className="flex items-center gap-1 cursor-pointer select-none shrink-0">
                    <input
                      type="checkbox"
                      checked={highestScoreNotOut}
                      onChange={(e) => setHighestScoreNotOut(e.target.checked)}
                      className="rounded border-slate-800 bg-slate-900 text-emerald-500 focus:ring-emerald-500/20 h-3.5 w-3.5"
                    />
                    <span className="text-[10px] font-bold text-slate-400 font-mono">N.O.</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase font-mono mb-1">Balls Faced</label>
                <input
                  type="number"
                  min="0"
                  value={ballsFaced || ""}
                  onChange={(e) => setBallsFaced(Number(e.target.value))}
                  placeholder="e.g. 4500"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded focus:border-emerald-500 text-xs text-white font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase font-mono mb-1">Calculated Batting SR</label>
                <div className="px-3 py-1.5 text-xs font-bold bg-[#0a0a0c] text-emerald-400 rounded border border-slate-800 select-none font-mono">
                  {battingStrikeRate > 0 ? battingStrikeRate.toFixed(2) : "0.00"}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase font-mono mb-1">Hundreds (100s)</label>
                <input
                  type="number"
                  min="0"
                  value={hundreds || ""}
                  onChange={(e) => setHundreds(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded focus:border-emerald-500 text-xs text-white font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase font-mono mb-1">Fifties (50s)</label>
                <input
                  type="number"
                  min="0"
                  value={fiftyPlus || ""}
                  onChange={(e) => setFiftyPlus(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded focus:border-emerald-500 text-xs text-white font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase font-mono mb-1">Fours (4s)</label>
                <input
                  type="number"
                  min="0"
                  value={fours || ""}
                  onChange={(e) => setFours(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded focus:border-emerald-500 text-xs text-white font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase font-mono mb-1">Sixes (6s)</label>
                <input
                  type="number"
                  min="0"
                  value={sixes || ""}
                  onChange={(e) => setSixes(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded focus:border-emerald-500 text-xs text-white font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase font-mono mb-1 font-mono">Calculated Average</label>
                <div className="px-3 py-1.5 text-xs font-bold bg-[#0a0a0c] text-emerald-400 rounded border border-slate-800 select-none font-mono">
                  {battingInnings > notOuts 
                    ? (battingRuns / (battingInnings - notOuts)).toFixed(2)
                    : battingInnings > 0 ? battingRuns.toFixed(2) : "0.00"
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Section C: Bowling Core Stats */}
          <div className={`space-y-4 transition-all duration-300 relative ${isPureBatsman ? "opacity-35 select-none" : ""}`}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-1">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-sky-400 uppercase tracking-widest font-mono">3. Bowling Career Statistics</h4>
                {isPureBatsman && (
                  <span className="text-[9px] font-bold text-amber-500 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-500/25 font-mono uppercase animate-pulse">
                    Dimmed (Pure Batsman)
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleAutoCalcBowling}
                disabled={isPureBatsman}
                className="text-[10px] font-bold text-sky-400 hover:text-white bg-sky-950/60 hover:bg-sky-900 border border-sky-505/20 px-2.5 py-1 rounded flex items-center gap-1 transition-all uppercase tracking-wide font-mono disabled:opacity-40 disabled:pointer-events-none"
              >
                <RefreshCw className="w-3 h-3" /> Auto-calculate SR & Econ
              </button>
            </div>
            
            <p className="text-[10px] text-slate-500 font-mono -mt-2">
              {isPureBatsman 
                ? "Bowling career parameters are inactive for non-bowling players. Change their Primary Role to Bowler or All-rounder to unlock."
                : "Enter career bowling values, then trigger the auto-calculate tool or set custom values directly."
              }
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase font-mono mb-1">Innings Bowled</label>
                <input
                  type="number"
                  min="0"
                  value={bowlingInnings || ""}
                  onChange={(e) => setBowlingInnings(Number(e.target.value))}
                  disabled={isPureBatsman}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded focus:border-sky-500/20 focus:border-sky-500 text-xs text-white font-mono outline-none disabled:bg-slate-950/50 disabled:text-slate-600 disabled:border-slate-900 disabled:cursor-not-allowed"
                />
                {!isPureBatsman && format === GameFormat.FC && (
                  <span className="text-[10px] text-sky-450 font-mono mt-1 block">FC allows up to 2 innings / match</span>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase font-mono mb-1">Overs Bowled</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="e.g. 45.2"
                  value={oversBowled || ""}
                  onChange={(e) => setOversBowled(Number(e.target.value))}
                  disabled={isPureBatsman}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded focus:border-sky-500/20 focus:border-sky-500 text-xs text-white font-mono outline-none disabled:bg-slate-950/50 disabled:text-slate-600 disabled:border-slate-900 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase font-mono mb-1">Runs Conceded</label>
                <input
                  type="number"
                  min="0"
                  value={runsConceded || ""}
                  onChange={(e) => setRunsConceded(Number(e.target.value))}
                  disabled={isPureBatsman}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded focus:border-sky-500/20 focus:border-sky-500 text-xs text-white font-mono outline-none disabled:bg-slate-950/50 disabled:text-slate-600 disabled:border-slate-900 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase font-mono mb-1">Wickets Taken</label>
                <input
                  type="number"
                  min="0"
                  value={wickets || ""}
                  onChange={(e) => setWickets(Number(e.target.value))}
                  disabled={isPureBatsman}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded focus:border-sky-500/20 focus:border-sky-500 text-xs text-white font-mono outline-none disabled:bg-slate-950/50 disabled:text-slate-600 disabled:border-slate-900 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase font-mono mb-1">Best Bowling Wkts</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  placeholder="e.g. 5"
                  value={bestBowlingWickets || ""}
                  onChange={(e) => setBestBowlingWickets(Number(e.target.value))}
                  disabled={isPureBatsman}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded focus:border-sky-500/20 focus:border-sky-500 text-xs text-white font-mono outline-none disabled:bg-slate-950/50 disabled:text-slate-600 disabled:border-slate-900 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase font-mono mb-1">Best Bowling Runs</label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 23"
                  value={bestBowlingRuns || ""}
                  onChange={(e) => setBestBowlingRuns(Number(e.target.value))}
                  disabled={isPureBatsman}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded focus:border-sky-500/20 focus:border-sky-500 text-xs text-white font-mono outline-none disabled:bg-slate-950/50 disabled:text-slate-600 disabled:border-slate-900 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase font-mono mb-1 font-mono">Calculated Economy Rate</label>
                <div className={`px-3 py-1.5 text-xs font-bold bg-[#0a0a0c] text-sky-400 rounded border border-slate-800 select-none font-mono ${isPureBatsman ? "opacity-35" : ""}`}>
                  {bowlingEconomy > 0 ? bowlingEconomy.toFixed(2) : "0.00"}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase font-mono mb-1 font-mono">Calculated Bowling SR</label>
                <div className={`px-3 py-1.5 text-xs font-bold bg-[#0a0a0c] text-sky-400 rounded border border-slate-800 select-none font-mono ${isPureBatsman ? "opacity-35" : ""}`}>
                  {bowlingStrikeRate > 0 ? bowlingStrikeRate.toFixed(2) : "0.00"}
                </div>
              </div>
            </div>
          </div>

          {/* Section D: Fielding Core Stats */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-amber-500 uppercase tracking-widest border-b border-slate-800/80 pb-1 font-mono">4. Fielding Statistics</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase font-mono mb-1">Catches Taken</label>
                <input
                  type="number"
                  min="0"
                  value={catches || 0}
                  onChange={(e) => setCatches(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded focus:border-amber-500 text-xs text-white font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase font-mono mb-1">Stumpings</label>
                <input
                  type="number"
                  min="0"
                  value={stumpings || 0}
                  onChange={(e) => setStumpings(Number(e.target.value))}
                  disabled={role !== PlayerRole.WicketKeeper}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded focus:border-amber-550/50 text-xs text-white font-mono outline-none disabled:bg-slate-950/50 disabled:text-slate-600 disabled:border-slate-900 disabled:cursor-not-allowed"
                />
                {role !== PlayerRole.WicketKeeper && (
                  <span className="text-[10px] text-slate-500 font-mono mt-1 block">Wicketkeepers only</span>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* Footer controls */}
        <div className="bg-[#16161c] border-t border-slate-800 px-6 py-4 flex items-center justify-end gap-3 sticky bottom-0 z-10">
          <button
            type="button"
            id="cancel-form-btn"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white border border-slate-800 hover:bg-slate-900 rounded transition-all uppercase tracking-wider font-mono"
          >
            Cancel
          </button>
          <button
            type="button"
            id="submit-form-btn"
            onClick={validateAndSubmit}
            className="px-5 py-2 text-xs font-bold text-black bg-emerald-400 hover:bg-emerald-300 rounded shadow-lg shadow-emerald-900/20 flex items-center gap-1.5 transition-all uppercase tracking-wider font-mono"
          >
            <Save className="w-3.5 h-3.5" /> Save Player Stats
          </button>
        </div>
      </div>
    </div>
  );
}
