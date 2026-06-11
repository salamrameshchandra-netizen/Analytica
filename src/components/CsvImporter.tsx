import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { PlayerStats, PlayerRole, GameFormat } from "../types";
import { Upload, Download, AlertTriangle, CheckCircle, Database, HelpCircle, X, Info } from "lucide-react";

interface CsvImporterProps {
  onImport: (importedPlayers: PlayerStats[], mode: "merge" | "overwrite") => void;
  onClose: () => void;
  existingPlayers: PlayerStats[];
}

export default function CsvImporter({ onImport, onClose, existingPlayers }: CsvImporterProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<PlayerStats[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper: Leniently map string to PlayerRole
  const mapRole = (roleStr: string): PlayerRole => {
    const s = roleStr.toLowerCase().trim();
    if (s.includes("wicket") || s.includes("keeper") || s.includes("wk")) {
      return PlayerRole.WicketKeeper;
    }
    if (s.includes("all-rounder") || s.includes("all_rounder") || s.includes("allrounder") || s.includes("ar")) {
      return PlayerRole.AllRounder;
    }
    if (s.includes("bowler") || s.includes("bowl") || s.includes("bowl")) {
      return PlayerRole.Bowler;
    }
    return PlayerRole.Batsman; // Default fallback
  };

  // Helper: Leniently map string to GameFormat
  const mapFormat = (fmtStr: string): GameFormat => {
    const q = fmtStr.toLowerCase().trim();
    if (q.includes("fc") || q.includes("first") || q.includes("class")) {
      return GameFormat.FC;
    }
    if (q.includes("list") || q.includes("lista") || q.includes("50-over") || q.includes("odi")) {
      return GameFormat.ListA;
    }
    if (q.includes("t20") || q.includes("twenty") || q.includes("20")) {
      return GameFormat.T20;
    }
    return GameFormat.FC; // Default fallback
  };

  // Helper parsing CSV text correctly handling quotes & commas
  const parseCSVText = (text: string): string[][] => {
    const lines: string[][] = [];
    let row: string[] = [];
    let inQuotes = false;
    let currentVal = "";

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        row.push(currentVal.trim());
        currentVal = "";
      } else if ((char === "\r" || char === "\n") && !inQuotes) {
        if (char === "\r" && nextChar === "\n") {
          i++; // Skip the '\n' part of carriage return
        }
        row.push(currentVal.trim());
        // Only load rows with content
        if (row.length > 1 || (row.length === 1 && row[0] !== "")) {
          lines.push(row);
        }
        row = [];
        currentVal = "";
      } else {
        currentVal += char;
      }
    }

    if (currentVal !== "" || row.length > 0) {
      row.push(currentVal.trim());
      if (row.length > 1 || (row.length === 1 && row[0] !== "")) {
        lines.push(row);
      }
    }

    return lines;
  };

  // Triggers template download for users as custom-crafted utility
  const downloadTemplate = () => {
    const csvContent = [
      "Player Name,State / Team,Primary Role,Match Format,Matches Played,Batting Innings,Not Outs,Batting Runs,Highest Score,Is Highest Score Not Out,Batting Strike Rate,Hundreds,Fifties,Bowling Innings,Overs Bowled,Runs Conceded,Wickets,Best Bowling Wickets,Best Bowling Runs,Bowling Economy,Bowling Strike Rate",
      "Virat Kohli,Delhi,Batsman,First-Class (FC),295,283,44,13884,254,true,102.5,41,74,0,0,0,0,0,0,0,0",
      "Jasprit Bumrah,Gujarat,Bowler,T20,89,35,19,418,34,false,115.4,0,0,89,328.4,2046,149,6,19,6.2,13.2",
      "Glenn Maxwell,Victoria,All-rounder,T20,141,127,18,3670,113,true,154.2,5,16,110,234.5,1832,58,3,10,7.8,24.2"
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "cricket_players_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Internal main file handler to extract coordinates
  const handleFileProcess = (file: File) => {
    setFileName(file.name);
    setError(null);
    setWarnings([]);
    setParsedRows([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        setError("Unable to read empty CSV or unreadable file format.");
        return;
      }

      try {
        const rows = parseCSVText(text);
        if (rows.length < 2) {
          setError("Empty CSV file or no records found below the header row.");
          return;
        }

        const rawHeaders = rows[0].map(h => h.toLowerCase().trim());
        
        // Find positions of required properties leniently
        const findCol = (keys: string[], defaultIdx: number): number => {
          for (let k of keys) {
            const idx = rawHeaders.findIndex(h => h.includes(k) || k.includes(h));
            if (idx !== -1) return idx;
          }
          return defaultIdx;
        };

        const idxName = findCol(["name", "player name", "player"], 0);
        const idxState = findCol(["state", "team", "belong"], 1);
        const idxRole = findCol(["role", "primary role"], 2);
        const idxFormat = findCol(["format", "match format", "game format"], 3);
        const idxMatches = findCol(["matches", "played", "match count"], 4);
        
        // Batting mappings
        const idxBatInnings = findCol(["batting innings", "batting_innings", "innings b", "bat innings"], 5);
        const idxNotOuts = findCol(["not outs", "notouts", "not_outs", "no"], 6);
        const idxBatRuns = findCol(["batting runs", "runs scored", "batting_runs", "runs"], 7);
        const idxHighest = findCol(["highest score", "highest_score", "hs", "highest"], 8);
        const idxHsNotOut = findCol(["highest score not out", "hs_not_out", "not out highest"], 9);
        const idxBatSr = findCol(["batting strike rate", "batting_strike_rate", "strike rate b", "sr"], 10);
        const idxHundreds = findCol(["hundreds", "100s", "100"], 11);
        const idxFifties = findCol(["fifties", "fifty", "50s", "50"], 12);

        // Bowling mappings
        const idxBowlInnings = findCol(["bowling innings", "bowling_innings", "innings w", "bowl innings"], 13);
        const idxOvers = findCol(["overs", "balls bowled", "overs bowled"], 14);
        const idxRunsConceded = findCol(["runs conceded", "runs_conceded", "runs c", "rc"], 15);
        const idxWickets = findCol(["wickets", "wkts", "wkt"], 16);
        const idxBestW = findCol(["best bowling wickets", "best wickets", "bb_w"], 17);
        const idxBestR = findCol(["best bowling runs", "best runs", "bb_r"], 18);
        const idxBowlEcon = findCol(["bowling economy", "economy", "econ", "er"], 19);
        const idxBowlSr = findCol(["bowling strike rate", "bowling sr", "strike rate w"], 20);

        const tempPlayers: PlayerStats[] = [];
        const tempWarnings: string[] = [];

        // Parse starting from row index 1 (skip header)
        for (let i = 1; i < rows.length; i++) {
          const cells = rows[i];
          if (cells.length === 0 || (cells.length === 1 && cells[0] === "")) continue;

          const name = cells[idxName] || "";
          if (!name) {
            tempWarnings.push(`Row ${i + 1}: Skipped due to missing Player Name.`);
            continue;
          }

          const state = cells[idxState] || "Unknown Team";
          const roleRaw = cells[idxRole] || "Batsman";
          const formatRaw = cells[idxFormat] || "First-Class (FC)";

          const mappedRole = mapRole(roleRaw);
          const mappedFormat = mapFormat(formatRaw);

          const matches = Math.max(0, Number(cells[idxMatches]) || 0);
          
          // Batting
          const battingInnings = Math.max(0, Number(cells[idxBatInnings]) || 0);
          const notOuts = Math.max(0, Number(cells[idxNotOuts]) || 0);
          const battingRuns = Math.max(0, Number(cells[idxBatRuns]) || 0);
          const highestScore = Math.max(0, Number(cells[idxHighest]) || 0);
          const highestScoreNotOutString = String(cells[idxHsNotOut] || "").toLowerCase().trim();
          const highestScoreNotOut = highestScoreNotOutString === "true" || highestScoreNotOutString === "1" || highestScoreNotOutString === "yes";
          const battingStrikeRate = Math.max(0, Number(cells[idxBatSr]) || 0);
          const hundreds = Math.max(0, Number(cells[idxHundreds]) || 0);
          const fiftyPlus = Math.max(0, Number(cells[idxFifties]) || 0);

          // Bowling
          const bowlingInnings = Math.max(0, Number(cells[idxBowlInnings]) || 0);
          const overs = Math.max(0, Number(cells[idxOvers]) || 0);
          const runsConceded = Math.max(0, Number(cells[idxRunsConceded]) || 0);
          const wickets = Math.max(0, Number(cells[idxWickets]) || 0);
          const bestBowlingWickets = Math.max(0, Number(cells[idxBestW]) || 0);
          const bestBowlingRuns = Math.max(0, Number(cells[idxBestR]) || 0);
          const bowlingEconomy = Math.max(0, Number(cells[idxBowlEcon]) || 0);
          const bowlingStrikeRate = Math.max(0, Number(cells[idxBowlSr]) || 0);

          // Perform basic logical metrics corrections/validations for sanity
          if (notOuts > battingInnings) {
            tempWarnings.push(`Row ${i + 1} ("${name}"): Not-outs (${notOuts}) cannot exceed batting innings (${battingInnings}). Reset not-outs to match.`);
          }
          const maxBatInnings = mappedFormat === GameFormat.FC ? matches * 2 : matches;
          if (battingInnings > maxBatInnings) {
            tempWarnings.push(`Row ${i + 1} ("${name}"): Batting innings (${battingInnings}) exceeds overall matches (${matches}) for First-Class (${mappedFormat}). Corrected matches.`);
          }
          const maxBowlInnings = mappedFormat === GameFormat.FC ? matches * 2 : matches;
          if (bowlingInnings > maxBowlInnings) {
            tempWarnings.push(`Row ${i + 1} ("${name}"): Bowling innings (${bowlingInnings}) exceeds overall matches (${matches}) for First-Class (${mappedFormat}). Corrected matches.`);
          }

          // Calculate ballsBowled from overs (e.g. 10.3 overs should map to (10 * 6) + 3 = 63 balls)
          const oversInt = Math.floor(overs);
          const oversFrac = Math.round((overs - oversInt) * 10);
          const ballsBowled = (oversInt * 6) + (oversFrac <= 5 ? oversFrac : 0);

          // Calculate ballsFaced automatically from runs and strike rate if available
          const ballsFaced = battingStrikeRate > 0 ? Math.round((battingRuns / battingStrikeRate) * 100) : 0;

          const playerRecord: PlayerStats = {
            id: `imported-${Date.now()}-${i}-${Math.floor(Math.random() * 10000)}`,
            name,
            state,
            role: mappedRole,
            format: mappedFormat,
            matches: Math.max(matches, mappedFormat === GameFormat.FC ? Math.ceil(battingInnings / 2) : battingInnings, mappedFormat === GameFormat.FC ? Math.ceil(bowlingInnings / 2) : bowlingInnings),
            battingInnings,
            notOuts: Math.min(notOuts, battingInnings),
            battingRuns,
            highestScore,
            highestScoreNotOut,
            ballsFaced,
            battingStrikeRate,
            hundreds,
            fiftyPlus,
            bowlingInnings,
            ballsBowled,
            runsConceded,
            wickets,
            bestBowlingWickets,
            bestBowlingRuns,
            bowlingEconomy,
            bowlingStrikeRate
          };

          tempPlayers.push(playerRecord);
        }

        if (tempPlayers.length === 0) {
          setError("All records in the CSV contain parsing anomalies and were rejected. Clean your file and retry.");
        } else {
          setParsedRows(tempPlayers);
          setWarnings(tempWarnings);
        }

      } catch (ex) {
        setError("Unexpected parser exception occurred. Please make sure the CSV has valid CSV format structures.");
        console.error("CSV Import ex", ex);
      }
    };
    reader.readAsText(file);
  };

  // React drag operations
  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith(".csv")) {
        handleFileProcess(droppedFile);
      } else {
        setError("Only valid .csv CSV spreadsheets are parsed by this systems.");
      }
    }
  };

  const handleManualSelection = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const triggerInputClick = () => {
    fileInputRef.current?.click();
  };

  const clearUploader = () => {
    setFileName("");
    setParsedRows([]);
    setWarnings([]);
    setError(null);
  };

  return (
    <div id="csv-import-modal-backdrop" className="fixed inset-0 bg-[#000]/80 backdrop-blur-sm z-[90] flex justify-center items-center p-4">
      <div id="csv-import-modal-box" className="bg-[#121216] border border-slate-800 rounded-lg max-w-3xl w-full scale-100 transition-all shadow-2xl relative flex flex-col max-h-[85vh]">
        
        {/* Header bar */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1 px-1.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Bulk CSV Import Deck</h3>
              <p className="text-[10px] text-slate-500 font-mono">Populate squad registries using automated batch ingestion spreadsheets</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="text-slate-500 hover:text-white p-1 hover:bg-slate-800/60 rounded transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* Section 1: Template Download Instructions */}
          <div className="bg-[#16161c] border border-slate-800 p-4 rounded flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-400 font-mono flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-emerald-500" /> Dynamic Guideline Reference
              </span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Download the spreadsheet format blueprint to align metric columns (Name, State, Role, Format, Match parameters) before feeding dataset files.
              </p>
            </div>
            <button
              type="button"
              id="csv-download-template-btn"
              onClick={downloadTemplate}
              className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850 rounded text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all shrink-0"
            >
              <Download className="w-3.5 h-3.5" /> Template.csv
            </button>
          </div>

          {!parsedRows.length ? (
            /* Drag & Drop uploader zone */
            <div
              id="csv-drop-zone"
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerInputClick}
              className={`border-2 border-dashed rounded-lg p-10 cursor-pointer flex flex-col items-center justify-center text-center transition-all ${
                dragActive 
                  ? "border-emerald-400 bg-emerald-950/10" 
                  : "border-slate-800 hover:border-slate-600 bg-slate-950/20"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".csv"
                onChange={handleManualSelection}
              />
              <Upload className={`w-8 h-8 mb-3 transition-colors ${dragActive ? "text-emerald-400 animate-bounce" : "text-slate-500"}`} />
              <p className="font-bold text-white text-[13px]">Drag & Drop your Player CSV file here</p>
              <p className="text-slate-500 font-mono text-[10px] mt-1">or click to browse local files system directories</p>
              
              <div className="mt-4 px-3 py-1 bg-slate-900 rounded border border-slate-800/80 text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                <span>Supported format matches: .csv format only</span>
              </div>
            </div>
          ) : (
            /* File is Selected / Parsed Zone */
            <div className="space-y-4">
              <div className="bg-[#16161c] border border-slate-800 rounded p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white font-mono text-xs">{fileName}</span>
                  <span className="text-slate-500 font-mono">({parsedRows.length} potential records matched)</span>
                </div>
                <button
                  type="button"
                  onClick={clearUploader}
                  className="px-2 py-1 text-[10px] hover:text-white bg-slate-900 border border-slate-850 rounded text-slate-400 font-mono hover:bg-slate-800"
                >
                  Change File
                </button>
              </div>

              {/* Parsing Warnings Log if any exist */}
              {warnings.length > 0 && (
                <div className="bg-amber-950/20 border border-amber-500/20 rounded p-3 max-h-[120px] overflow-y-auto space-y-1">
                  <div className="flex items-center gap-1 text-amber-400 font-bold font-mono text-[10px] uppercase tracking-wider">
                    <AlertTriangle className="w-3.5 h-3.5" /> Ingestion Notice & Diagnostics ({warnings.length}):
                  </div>
                  {warnings.map((warn, wIdx) => (
                    <p key={wIdx} className="text-amber-500/80 font-mono text-[9px] leading-tight">• {warn}</p>
                  ))}
                </div>
              )}

              {/* Data Preview Table */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">Ingestion Roster Preview</span>
                <div className="border border-slate-800 rounded overflow-hidden max-h-[220px] overflow-y-auto">
                  <table className="w-full text-left border-collapse bg-[#16161c]/40 font-mono select-none">
                    <thead className="bg-[#121216] border-b border-slate-800 text-[10px] text-slate-500 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 font-bold">Player Name</th>
                        <th className="px-3 py-2 font-bold">State</th>
                        <th className="px-3 py-2 font-bold">Primary Role</th>
                        <th className="px-3 py-2 font-bold">Format</th>
                        <th className="px-3 py-2 font-bold text-right">Matches</th>
                        <th className="px-3 py-2 font-bold text-right">Runs</th>
                        <th className="px-3 py-2 font-bold text-right">Wickets</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-[11px] text-slate-300">
                      {parsedRows.slice(0, 8).map((p, pIdx) => (
                        <tr key={pIdx} className="hover:bg-slate-900/30">
                          <td className="px-3 py-1.5 font-bold text-white">{p.name}</td>
                          <td className="px-3 py-1.5 text-slate-400">{p.state}</td>
                          <td className="px-3 py-1.5 text-emerald-400 text-[10px] uppercase font-semibold">{p.role}</td>
                          <td className="px-3 py-1.5 text-sky-400 font-semibold">{p.format}</td>
                          <td className="px-3 py-1.5 text-right font-semibold text-slate-200">{p.matches}</td>
                          <td className="px-3 py-1.5 text-right text-emerald-450">{p.battingRuns}</td>
                          <td className="px-3 py-1.5 text-right text-sky-450">{p.wickets}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedRows.length > 8 && (
                    <div className="text-center p-2.5 bg-[#121216]/50 text-slate-500 text-[10px] font-mono border-t border-slate-800">
                      Plus {parsedRows.length - 8} additional records in queue...
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="bg-rose-950/20 border border-rose-500/25 rounded p-3 text-rose-400 font-mono text-[11px] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

        </div>

        {/* Footer actions bar */}
        <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-[#16161c]">
          <button
            type="button"
            id="csv-cancel-btn"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded hover:bg-slate-850 font-mono font-bold tracking-wider uppercase text-[11px]"
          >
            Collapse Panel
          </button>

          {parsedRows.length > 0 && (
            <div className="flex items-center gap-2">
              {/* Option A: Merge Append */}
              <button
                type="button"
                id="csv-import-merge-btn"
                onClick={() => onImport(parsedRows, "merge")}
                className="px-4 py-1.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded font-mono font-bold tracking-wider uppercase text-[11px] flex items-center gap-1.5 shadow-md shadow-indigo-950/30"
              >
                <span>Merge and Append</span>
              </button>

              {/* Option B: Overwrite Erasure */}
              <button
                type="button"
                id="csv-import-overwrite-btn"
                onClick={() => onImport(parsedRows, "overwrite")}
                className="px-4 py-1.5 bg-rose-655 hover:bg-rose-600 text-white rounded font-mono font-bold tracking-wider uppercase text-[11px] flex items-center gap-1.5 shadow-md shadow-rose-950/20"
              >
                <span>Replace Roster</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
