"use client";

import { useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";
import { MOCK_LEADERBOARD } from "@/lib/api";

function LeaderboardContent() {
  const router = useRouter();
  const { playerName, metrics, resetGame } = useGame();

  const netWorth = metrics.netWorth ?? (metrics.savingsBalance + metrics.retirementBalance - metrics.totalDebt);

  const handlePlayAgain = () => {
    resetGame();
    router.push("/setup");
  };

  // Insert the current player into the leaderboard if they have data
  const leaderboard = playerName
    ? [
        ...MOCK_LEADERBOARD.slice(0, 8),
        {
          rank: 9,
          name: `${playerName} (You)`,
          netWorth,
          creditScore: metrics.creditScore,
          score: Math.floor(netWorth / 8 + metrics.creditScore * 2),
          isCurrentPlayer: true,
        },
        MOCK_LEADERBOARD[9],
      ]
    : MOCK_LEADERBOARD;

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-16">
      {/* Fixed ambient glow */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-96 h-48 opacity-[0.06] pointer-events-none"
        style={{ background: "radial-gradient(ellipse, #F59E0B, transparent 70%)" }}
      />

      <div className="max-w-3xl mx-auto px-4 pt-10 relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-medium mb-3"
              style={{
                background: "rgba(245,158,11,0.05)",
                borderColor: "rgba(245,158,11,0.2)",
                color: "#F59E0B",
              }}
            >
              🏆 ALL-TIME LEADERBOARD
            </div>
            <h1
              className="text-3xl font-extrabold text-[#F5F5F5]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Top Simulators
            </h1>
            <p className="text-[#6B6B6B] text-sm mt-1">
              Ranked by composite financial score
            </p>
          </div>
          <button
            onClick={handlePlayAgain}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
            style={{
              background: "#F59E0B",
              color: "#0A0A0A",
              fontFamily: "var(--font-display)",
            }}
          >
            Play Again
          </button>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[40px_1fr_100px_100px_90px] gap-3 px-4 mb-2">
          {["#", "Player", "Net Worth", "Credit", "Score"].map((h) => (
            <div key={h} className="text-[10px] text-[#4A4A4A] uppercase tracking-widest font-medium">
              {h}
            </div>
          ))}
        </div>

        {/* Rows */}
        <div className="rounded-2xl bg-[#111111] border border-[#1F1F1F] overflow-hidden">
          {leaderboard.map((player) => {
            const isCurrentPlayer = player.isCurrentPlayer;
            const isTop3 = player.rank <= 3;

            return (
              <div
                key={`${player.rank}-${player.name}`}
                className="grid grid-cols-[40px_1fr_100px_100px_90px] gap-3 items-center px-4 py-3.5 border-b last:border-b-0 transition-colors"
                style={{
                  borderColor: "#1A1A1A",
                  background: isCurrentPlayer
                    ? "rgba(245,158,11,0.05)"
                    : "transparent",
                  borderLeft: isCurrentPlayer
                    ? "2px solid rgba(245,158,11,0.4)"
                    : "2px solid transparent",
                }}
                aria-current={isCurrentPlayer ? "true" : undefined}
              >
                {/* Rank */}
                <div>
                  {isTop3 ? (
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-extrabold"
                      style={{
                        background:
                          player.rank === 1
                            ? "rgba(245,158,11,0.15)"
                            : player.rank === 2
                            ? "rgba(161,161,161,0.12)"
                            : "rgba(180,100,40,0.12)",
                        color:
                          player.rank === 1
                            ? "#F59E0B"
                            : player.rank === 2
                            ? "#A1A1A1"
                            : "#B46428",
                        border: `1px solid ${
                          player.rank === 1
                            ? "rgba(245,158,11,0.3)"
                            : player.rank === 2
                            ? "rgba(161,161,161,0.25)"
                            : "rgba(180,100,40,0.25)"
                        }`,
                      }}
                    >
                      {player.rank}
                    </div>
                  ) : (
                    <span
                      className="text-[13px] font-medium pl-2"
                      style={{ color: isCurrentPlayer ? "#F59E0B" : "#4A4A4A" }}
                    >
                      {player.rank}
                    </span>
                  )}
                </div>

                {/* Name */}
                <div
                  className="text-sm font-medium truncate"
                  style={{
                    color: isCurrentPlayer ? "#F59E0B" : "#F5F5F5",
                    fontFamily: isTop3 ? "var(--font-display)" : "inherit",
                  }}
                >
                  {player.name}
                </div>

                {/* Net Worth */}
                <div
                  className="text-sm font-semibold tabular-nums"
                  style={{ color: player.netWorth >= 0 ? "#10B981" : "#EF4444" }}
                >
                  ${player.netWorth.toLocaleString()}
                </div>

                {/* Credit Score */}
                <div
                  className="text-sm font-medium tabular-nums"
                  style={{
                    color:
                      player.creditScore >= 700
                        ? "#10B981"
                        : player.creditScore >= 600
                        ? "#F59E0B"
                        : "#EF4444",
                  }}
                >
                  {player.creditScore}
                </div>

                {/* Score */}
                <div className="text-sm font-bold text-[#F5F5F5] tabular-nums">
                  {player.score.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex gap-4 text-[11px] text-[#4A4A4A]">
          <span>Score = (Net Worth ÷ 8) + (Credit Score × 2)</span>
        </div>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  return <LeaderboardContent />;
}
