import { jsPDF } from "jspdf";
import { PlayerStats, PlayerRole } from "../types";
import {
  calculateBattingAverage,
  calculateBowlingEconomy,
  calculateBowlingStrikeRate,
  calculateBowlingAverage,
  calculateAllRounderIndex
} from "../initialData";

export function generatePdfReport(players: PlayerStats[]) {
  // Landscape is essential for wide multi-column cricket tables
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4"
  });

  const margin = 15;
  let y = 15;

  // Header Banner Box
  doc.setFillColor(15, 23, 42); // slate-900 background
  doc.rect(0, 0, 297, 32, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("CRICKET SQUAD PERFORMANCE ANALYTICAL REPORT", margin, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`Generated on: ${new Date().toLocaleDateString()}  |  Active Squad Configuration: ${players.length} Players`, margin, 25);

  y = 44;

  // Let's compute top analytical standouts for cards
  const topAverage = [...players].sort((a, b) => calculateBattingAverage(b) - calculateBattingAverage(a))[0];
  const topWickets = [...players].sort((a, b) => b.wickets - a.wickets)[0];
  const topStrikeRate = [...players].filter(p => p.battingInnings > 3).sort((a, b) => b.battingStrikeRate - a.battingStrikeRate)[0];

  // Visual standalone standout highlights (3 cards)
  const cardWidth = 84;
  const cardHeight = 22;

  // Card 1: Consistency Batter
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, cardWidth, cardHeight, 1.5, 1.5, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(16, 185, 129); // emerald-500
  doc.text("CONSISTENCY BATSTMAN ACCLAIM", margin + 5, y + 5);
  if (topAverage) {
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.text(topAverage.name, margin + 5, y + 11);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Batting Average: ${calculateBattingAverage(topAverage).toFixed(2)}  |  Runs: ${topAverage.battingRuns}`, margin + 5, y + 16);
  }

  // Card 2: Strike-Taker
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin + cardWidth + 5, y, cardWidth, cardHeight, 1.5, 1.5, "FD");
  doc.setFont("text", "bold");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(14, 165, 233); // sky-500
  doc.text("PRIMARY ATTACK BOWLER", margin + cardWidth + 10, y + 5);
  if (topWickets) {
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.text(topWickets.name, margin + cardWidth + 10, y + 11);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Wickets Captured: ${topWickets.wickets}  |  Economy Rate: ${calculateBowlingEconomy(topWickets).toFixed(2)}`, margin + cardWidth + 10, y + 16);
  }

  // Card 3: Power Strike Rating
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin + (cardWidth * 2) + 10, y, cardWidth, cardHeight, 1.5, 1.5, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(245, 158, 11); // amber-500
  doc.text("HIGHEST STRIKE CAPACITY", margin + (cardWidth * 2) + 15, y + 5);
  if (topStrikeRate) {
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.text(topStrikeRate.name, margin + (cardWidth * 2) + 15, y + 11);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Strike Velocity: ${topStrikeRate.battingStrikeRate.toFixed(1)}  |  Total 100s: ${topStrikeRate.hundreds}`, margin + (cardWidth * 2) + 15, y + 16);
  }

  y += cardHeight + 10;

  // Title for Details Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("DETAILED CAREER ATHLETE LEDGER", margin, y);
  
  y += 4;

  // Table header mappings and starting horizontal offsets
  const colStarts = [
    margin,           // Player details (0)
    margin + 48,      // Role (1)
    margin + 75,      // Matches (2)
    margin + 90,     // Innings (3)
    margin + 108,     // Runs (4)
    margin + 128,     // Batting Avg (5)
    margin + 152,     // Batting Strike (6)
    margin + 175,     // Ball overs (7)
    margin + 195,     // Wickets (8)
    margin + 212,     // Bowl economy (9)
    margin + 235,     // Bowl Strike (10)
    margin + 253      // AR Index (11)
  ];

  const headers = [
    "Player Name",
    "Primary Role",
    "Matches",
    "Innings",
    "Runs",
    "Bat Avg",
    "Bat SR",
    "Bowl Inns",
    "Wickets",
    "Economy",
    "Bowl SR",
    "AR Index"
  ];

  // Draw header block background
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(margin, y, 267, 8, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);

  headers.forEach((header, index) => {
    doc.text(header, colStarts[index], y + 5.5);
  });

  y += 8;

  // Core Rows Rendering
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");

  players.forEach((player, index) => {
    // Alternate row colors
    if (index % 2 === 0) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(241, 245, 249); // slate-100
    }
    doc.rect(margin, y, 267, 7.5, "F");

    let textColors = [15, 23, 42]; // dark gray
    doc.setTextColor(textColors[0], textColors[1], textColors[2]);

    const finalAvg = calculateBattingAverage(player);
    const finalEcon = calculateBowlingEconomy(player);
    const finalBowlSR = calculateBowlingStrikeRate(player);
    // Calculation helper for AR index or other simple rates
    const arIndexVal = finalAvg > 0 && finalEcon > 0 ? (finalAvg - finalEcon).toFixed(1) : "0.0";

    const cells = [
      `${player.name} (${player.state || ""}) [${player.format || ""}]`,
      player.role,
      player.matches.toString(),
      player.battingInnings.toString(),
      player.battingRuns.toLocaleString(),
      finalAvg > 0 ? finalAvg.toFixed(2) : "-",
      player.battingStrikeRate > 0 ? player.battingStrikeRate.toFixed(1) : "-",
      player.bowlingInnings.toString(),
      player.wickets.toString(),
      finalEcon > 0 ? finalEcon.toFixed(2) : "-",
      finalBowlSR > 0 ? finalBowlSR.toFixed(1) : "-",
      arIndexVal
    ];

    cells.forEach((text, i) => {
      if (i === 0) {
        doc.setFont("helvetica", "bold");
      } else {
        doc.setFont("helvetica", "normal");
      }
      doc.text(text, colStarts[i], y + 5);
    });

    y += 7.5;

    // Check for page overflow
    if (y > 185 && index < players.length - 1) {
      // Draw Page Footer before launching new page
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text("CRICKET ANALYTICS CORP. PLOTTED AT THE SPORTS LABORATORY.", margin, 198);
      
      doc.addPage();
      y = 15;

      // Repeat Table Headers on second page
      doc.setFillColor(30, 41, 59);
      doc.rect(margin, y, 267, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      
      headers.forEach((header, idx) => {
        doc.text(header, colStarts[idx], y + 5.5);
      });
      
      y += 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
    }
  });

  // Footer section
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text("CRICKET PERFORMANCE ANALYSIS REPORT. PRODUCED CONCURRENTLY BY SPORTS STATISTIC ENGINEERS.", margin, 198);
  doc.text("Page 1 of 1", 258, 198);

  // Trigger browser download and return
  doc.save(`Cricket_Squad_Analysis_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function generateDuelComparisonPdf(playerA: PlayerStats, playerB: PlayerStats) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const margin = 15;
  let y = 15;

  // Header Box
  doc.setFillColor(15, 23, 42); // slate-900 background
  doc.rect(10, 10, 190, 26, "F");

  // Title: Header badge
  doc.setTextColor(52, 211, 153); // emerald-400
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("HEAD-TO-HEAD DUEL METRIC REPORT", margin, 17);

  // Core Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text("SQUAD ATHLETE SIDE-BY-SIDE LEDGER", margin, 24);

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184); // slate-400
  const dateStr = new Date().toLocaleString();
  doc.text(`Generated: ${dateStr}  |  Platform: Cricket Squad Analytics`, margin, 31);

  // Right-aligned status
  doc.setFont("helvetica", "bold");
  doc.setTextColor(244, 63, 94); // rose-500
  doc.text("CLASSIFIED TELEMETRY", 200, 17, { align: "right" });

  y = 44;

  // 2. Athlete Profiles side-by-side
  const colW = 83;
  const colA_x = margin;
  const colB_x = margin + colW + 14; 

  const avgA = calculateBattingAverage(playerA);
  const avgB = calculateBattingAverage(playerB);
  const econA = calculateBowlingEconomy(playerA);
  const econB = calculateBowlingEconomy(playerB);
  const srA = calculateBowlingStrikeRate(playerA);
  const srB = calculateBowlingStrikeRate(playerB);
  const arA = calculateAllRounderIndex(playerA);
  const arB = calculateAllRounderIndex(playerB);

  // Card Player A
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(colA_x, y, colW, 26, 1.5, 1.5, "FD");
  
  // Left side colored indicator for Card A
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(colA_x, y, 2.5, 26, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(16, 185, 129);
  doc.text("PLAYER ALPHA (CONTESTANT ID_01)", colA_x + 5, y + 5);

  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFontSize(11);
  doc.text(playerA.name, colA_x + 5, y + 11.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Origin State: ${playerA.state || "N/A"}  |  Game Format: ${playerA.format || "N/A"}`, colA_x + 5, y + 17);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`Primary Designated Role: ${playerA.role}`, colA_x + 5, y + 21.5);

  // Card Player B
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(colB_x, y, colW, 26, 1.5, 1.5, "FD");

  // Left side colored indicator for Card B
  doc.setFillColor(14, 165, 233); // sky-500
  doc.rect(colB_x, y, 2.5, 26, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(14, 165, 233);
  doc.text("PLAYER BETA (CONTESTANT ID_02)", colB_x + 5, y + 5);

  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFontSize(11);
  doc.text(playerB.name, colB_x + 5, y + 11.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Origin State: ${playerB.state || "N/A"}  |  Game Format: ${playerB.format || "N/A"}`, colB_x + 5, y + 17);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`Primary Designated Role: ${playerB.role}`, colB_x + 5, y + 21.5);

  y = 76;

  // 3. Stats Comparison Table
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(margin, y, 180, 8, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  
  doc.text("STATISTIC METRIC DESCRIPTION", margin + 4, y + 5.5);
  doc.text("ALPHA PERFORMANCE", margin + 70, y + 5.5, { align: "center" });
  doc.text("DUEL VERDICT", margin + 112, y + 5.5, { align: "center" });
  doc.text("BETA PERFORMANCE", margin + 154, y + 5.5, { align: "center" });

  y += 8;

  const getWinner = (vA: number, vB: number, higherIsBetter: boolean) => {
    if (vA === vB) return "tie";
    if (higherIsBetter) {
      return vA > vB ? "A" : "B";
    } else {
      if (vA <= 0) return "B";
      if (vB <= 0) return "A";
      return vA < vB ? "A" : "B";
    }
  };

  const rows = [
    { label: "Matches Played", valA: playerA.matches, valB: playerB.matches, higher: true, format: (v: number) => v.toString() },
    { label: "Batting Runs Scored", valA: playerA.battingRuns, valB: playerB.battingRuns, higher: true, format: (v: number) => v.toLocaleString() },
    { label: "Batting Average", valA: avgA, valB: avgB, higher: true, format: (v: number) => v > 0 ? v.toFixed(2) : "0.00" },
    { label: "Batting Strike Rate", valA: playerA.battingStrikeRate, valB: playerB.battingStrikeRate, higher: true, format: (v: number) => v > 0 ? v.toFixed(1) : "0.0" },
    { label: "Highest Score Peak", valA: playerA.highestScore, valB: playerB.highestScore, higher: true, format: (v: number, p: PlayerStats) => `${v}${p.highestScoreNotOut ? "*" : ""}` },
    { label: "Hundreds (100s)", valA: playerA.hundreds, valB: playerB.hundreds, higher: true, format: (v: number) => v.toString() },
    { label: "Fifties (50s)", valA: playerA.fiftyPlus, valB: playerB.fiftyPlus, higher: true, format: (v: number) => v.toString() },
    { label: "Fours (4s) Boundaries", valA: playerA.fours || 0, valB: playerB.fours || 0, higher: true, format: (v: number) => v.toLocaleString() },
    { label: "Sixes (6s) Boundaries", valA: playerA.sixes || 0, valB: playerB.sixes || 0, higher: true, format: (v: number) => v.toLocaleString() },
    { label: "Wickets Taken", valA: playerA.wickets, valB: playerB.wickets, higher: true, format: (v: number) => v.toString() },
    { label: "Bowling Economy Rate", valA: econA, valB: econB, higher: false, format: (v: number) => v > 0 ? v.toFixed(2) : "N/A" },
    { label: "Bowling Strike Rate", valA: srA, valB: srB, higher: false, format: (v: number) => v > 0 ? v.toFixed(1) : "N/A" },
    { label: "Catches Taken", valA: playerA.catches || 0, valB: playerB.catches || 0, higher: true, format: (v: number) => v.toString() },
    { label: "Stumpings Executed", valA: playerA.stumpings || 0, valB: playerB.stumpings || 0, higher: true, format: (v: number, p: PlayerStats) => p.role === PlayerRole.WicketKeeper ? v.toString() : "0 (Fielder)" },
    { label: "All-rounder Rating Index", valA: arA, valB: arB, higher: true, format: (v: number) => v.toFixed(2) }
  ];

  doc.setFontSize(7.5);
  let winsACount = 0;
  let winsBCount = 0;
  let tiesCount = 0;

  rows.forEach((row, index) => {
    if (index % 2 === 0) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(248, 250, 252); 
    }
    doc.rect(margin, y, 180, 8, "F");

    const winner = getWinner(row.valA, row.valB, row.higher);
    if (winner === "A") winsACount++;
    else if (winner === "B") winsBCount++;
    else tiesCount++;

    const displayA = row.format(row.valA, playerA);
    const displayB = row.format(row.valB, playerB);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(51, 65, 85); 
    doc.text(row.label, margin + 4, y + 5);

    if (winner === "A") {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(16, 185, 129); 
      doc.text(`${displayA} [W]`, margin + 70, y + 5, { align: "center" });
    } else {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139); 
      doc.text(displayA, margin + 70, y + 5, { align: "center" });
    }

    doc.setFont("helvetica", "bold");
    if (winner === "A") {
      doc.setTextColor(16, 185, 129);
      doc.text("▲ ALPHA WINS", margin + 112, y + 5, { align: "center" });
    } else if (winner === "B") {
      doc.setTextColor(14, 165, 233); 
      doc.text("▼ BETA WINS", margin + 112, y + 5, { align: "center" });
    } else {
      doc.setTextColor(148, 163, 184); 
      doc.text("■ DRAW / TIE", margin + 112, y + 5, { align: "center" });
    }

    if (winner === "B") {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(14, 165, 233); 
      doc.text(`[W] ${displayB}`, margin + 154, y + 5, { align: "center" });
    } else {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139); 
      doc.text(displayB, margin + 154, y + 5, { align: "center" });
    }

    doc.setDrawColor(241, 245, 249); 
    doc.line(margin, y + 8, margin + 180, y + 8);

    y += 8;
  });

  y += 5; 

  doc.setFillColor(241, 245, 249); 
  doc.setDrawColor(226, 232, 240); 
  doc.roundedRect(margin, y, 180, 26, 1.5, 1.5, "FD");

  doc.setFillColor(15, 23, 42); 
  doc.rect(margin, y, 2.5, 26, "F");

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("ACTIVE DUEL VERDICT MATRIX CONCLUSION", margin + 5, y + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Comparative Scope: 15 Core Benchmarks Registered  |  Alpha Parameter Wins: ${winsACount}  |  Beta Parameter Wins: ${winsBCount}  |  Ties/Equal: ${tiesCount}`, margin + 5, y + 11.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);

  let conclusionText = "";
  if (winsACount > winsBCount) {
    conclusionText = `EXPERT VERDICT: ${playerA.name} is the statistically superior option. They captured ${winsACount} out of 15 performance attributes, showcasing greater athletic stability and efficacy.`;
  } else if (winsBCount > winsACount) {
    conclusionText = `EXPERT VERDICT: ${playerB.name} is the statistically superior option. They asserted dominance in ${winsBCount} out of 15 performance attributes, demonstrating outstanding delivery or technical strength.`;
  } else {
    conclusionText = `EXPERT VERDICT: Direct competitive equilibrium. Both ${playerA.name} and ${playerB.name} won exactly ${winsACount} parameters, showcasing distinct relative strengths in defensive vs offensive workloads.`;
  }

  const splitText = doc.splitTextToSize(conclusionText, 170);
  doc.text(splitText, margin + 5, y + 17.5);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text("CRICKET HEAD-TO-HEAD DUEL METRIC ANALYTICAL SYSTEM. PRODUCED SECURELY BY INTELLIGENT SPORTS ENGINES.", margin, 278);
  doc.text("Page 1 of 1", 195, 278, { align: "right" });

  doc.save(`Duel_Comparison_${playerA.id}_vs_${playerB.id}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
