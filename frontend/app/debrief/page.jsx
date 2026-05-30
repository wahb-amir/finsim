"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useGame } from "@/context/GameContext";
import { useAuth } from "../context/AuthContext";
import dynamic from "next/dynamic";

const NetWorthChart = dynamic(() => import("@/components/ui/NetWorthChart"), {
  ssr: false,
});

const API = process.env.NEXT_PUBLIC_API_URL;

function DebriefContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const { user, loading: authLoading } = useAuth();
  const { playerName, metrics, debriefData, setDebriefData, resetGame, scenarioId, hydrateGameView } =
    useGame();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serverMetrics, setServerMetrics] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!sessionId || authLoading || !user) return;

    let cancelled = false;

    const loadDebrief = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API}/game/session/${sessionId}/debrief`, {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();

        if (!res.ok || !data?.success) {
          throw new Error(data?.message || "Failed to load debrief");
        }

        if (cancelled) return;

        setDebriefData(data.debrief);
        setServerMetrics(data.metrics);
        if (data.metrics) {
          hydrateGameView({ metrics: data.metrics });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Could not load debrief");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadDebrief();
    return () => {
      cancelled = true;
    };
  }, [sessionId, authLoading, user, setDebriefData, hydrateGameView]);

  const debrief = debriefData;
  const displayMetrics = serverMetrics || metrics;
  const netWorth = displayMetrics?.netWorth ?? debrief?.finalMetrics?.netWorth ?? 0;
  const isPositive = netWorth >= 0;

  const optimalPath = debrief?.optimalPath || [];
  const optimalMatches = optimalPath.filter((x) => x.match).length;
  const matchRate =
    optimalPath.length > 0
      ? Math.round((optimalMatches / optimalPath.length) * 100)
      : 0;

  const macroRiskLabel =
    (displayMetrics?.recessionProbAnnual ?? 0) > 0.26
      ? "High"
      : (displayMetrics?.recessionProbAnnual ?? 0) > 0.18
        ? "Medium"
        : "Low";

  const handleShare = () => {
    const text =
      debrief?.shareText ||
      `FinSim Result — ${playerName || debrief?.playerName || "Player"}\nNet Worth: $${netWorth.toLocaleString()}\nCredit Score: ${displayMetrics?.creditScore ?? "—"}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePlayAgain = () => {
    resetGame();
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("gameSessionId");
    }
    router.push("/setup");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center gap-1.5 mb-4">
            <div className="w-2 h-2 rounded-full bg-[#F59E0B] dot-1" />
            <div className="w-2 h-2 rounded-full bg-[#F59E0B] dot-2" />
            <div className="w-2 h-2 rounded-full bg-[#F59E0B] dot-3" />
          </div>
          <p className="text-[#6B6B6B] text-sm">
            Analyzing your financial journey with AI...
          </p>
        </div>
      </div>
    );
  }

  if (error || !debrief) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-red-400 mb-4">{error || "Debrief unavailable"}</p>
          <button
            type="button"
            onClick={() => router.push("/setup")}
            className="px-6 py-3 rounded-xl bg-[#F59E0B] text-[#0A0A0A] font-semibold text-sm"
          >
            Back to Setup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-24">
      <div
        className="fixed top-0 left-0 right-0 h-64 pointer-events-none opacity-20"
        style={{
          background: isPositive
            ? "radial-gradient(ellipse at center top, #10B981, transparent 70%)"
            : "radial-gradient(ellipse at center top, #EF4444, transparent 70%)",
        }}
      />

      <div className="max-w-5xl mx-auto px-4 pt-12 relative z-10">
        <div className="text-center mb-12 animate-fade-in-up">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-medium mb-6"
            style={{
              background: "rgba(245,158,11,0.05)",
              borderColor: "rgba(245,158,11,0.2)",
              color: "#F59E0B",
            }}
          >
            SIMULATION COMPLETE · 10 ROUNDS
            {debrief.scoreLabel ? ` · ${debrief.scoreLabel}` : ""}
          </div>

          <div
            className="text-6xl md:text-8xl font-extrabold tracking-tight mb-3"
            style={{
              fontFamily: "var(--font-display)",
              color: isPositive ? "#10B981" : "#EF4444",
            }}
          >
            {isPositive ? "+" : ""}${netWorth.toLocaleString()}
          </div>
          <p className="text-[#A1A1A1] text-lg mb-2">
            {debrief.playerName || playerName || "Your"} net worth at age 31
          </p>
          <p
            className="text-[#F5F5F5] max-w-md mx-auto leading-relaxed"
            style={{ fontFamily: "var(--font-display)" }}
          >
            &ldquo;{debrief.verdict}&rdquo;
          </p>
          {debrief.subverdict ? (
            <p className="text-[#6B6B6B] text-sm mt-3 max-w-lg mx-auto">{debrief.subverdict}</p>
          ) : null}
        </div>

        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
          style={{ animationDelay: "0.1s", animationFillMode: "both" }}
        >
          {[
            {
              label: "Net Worth",
              value: `${isPositive ? "+" : ""}$${netWorth.toLocaleString()}`,
              color: isPositive ? "#10B981" : "#EF4444",
            },
            {
              label: "Credit Score",
              value: displayMetrics?.creditScore ?? "—",
              color:
                (displayMetrics?.creditScore ?? 0) >= 700
                  ? "#10B981"
                  : (displayMetrics?.creditScore ?? 0) >= 600
                    ? "#F59E0B"
                    : "#EF4444",
            },
            {
              label: "Total Debt",
              value: `$${(displayMetrics?.totalDebt ?? 0).toLocaleString()}`,
              color:
                (displayMetrics?.totalDebt ?? 0) === 0
                  ? "#10B981"
                  : (displayMetrics?.totalDebt ?? 0) < 20000
                    ? "#F59E0B"
                    : "#EF4444",
            },
            {
              label: "Retirement",
              value: `$${(displayMetrics?.retirementBalance ?? 0).toLocaleString()}`,
              color:
                (displayMetrics?.retirementBalance ?? 0) > 5000 ? "#10B981" : "#F59E0B",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl bg-[#111111] border border-[#1F1F1F] p-5 relative overflow-hidden"
            >
              <div
                className="absolute top-0 right-0 w-20 h-20 rounded-bl-full opacity-5"
                style={{ background: stat.color }}
              />
              <div
                className="text-2xl font-bold mb-1"
                style={{ fontFamily: "var(--font-display)", color: stat.color }}
              >
                {stat.value}
              </div>
              <div className="text-[11px] text-[#6B6B6B] uppercase tracking-widest">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {debrief.netWorthProgression?.length > 0 ? (
          <div className="rounded-2xl bg-[#111111] border border-[#1F1F1F] p-6 mb-8">
            <h2
              className="font-bold text-[#F5F5F5] mb-1"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Your Path vs Optimal Path
            </h2>
            <p className="text-[11px] text-[#6B6B6B] mb-6">
              Net worth progression across 10 rounds
            </p>
            <NetWorthChart data={debrief.netWorthProgression} />
          </div>
        ) : null}

        {optimalPath.length > 0 ? (
          <div className="rounded-2xl bg-[#111111] border border-[#1F1F1F] p-6 mb-8">
            <h2
              className="font-bold text-[#F5F5F5] mb-1"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Decision Breakdown
            </h2>
            <p className="text-[11px] text-[#6B6B6B] mb-6">
              What you chose vs. the optimal play
            </p>

            <div className="space-y-2">
              {optimalPath.map((item) => (
                <div
                  key={item.round}
                  className="grid grid-cols-[32px_1fr_1fr] gap-3 items-center py-2.5 px-3 rounded-lg"
                  style={{
                    background: item.match
                      ? "rgba(16,185,129,0.04)"
                      : "rgba(239,68,68,0.04)",
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                    style={{
                      background: item.match
                        ? "rgba(16,185,129,0.12)"
                        : "rgba(239,68,68,0.12)",
                      color: item.match ? "#10B981" : "#EF4444",
                      border: `1px solid ${item.match ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
                    }}
                  >
                    {item.round}
                  </div>
                  <div>
                    <div className="text-[11px] text-[#6B6B6B] mb-0.5">You chose</div>
                    <div
                      className="text-[12px] font-medium"
                      style={{ color: item.match ? "#10B981" : "#EF4444" }}
                    >
                      {item.choice}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#6B6B6B] mb-0.5">Optimal</div>
                    <div className="text-[12px] font-medium text-[#A1A1A1]">{item.optimal}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-[#1F1F1F] flex items-center justify-between">
              <span className="text-[11px] text-[#6B6B6B]">Optimal decisions matched</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-1.5 rounded-full bg-[#1F1F1F] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${matchRate}%`,
                      background: "#10B981",
                    }}
                  />
                </div>
                <span className="text-[12px] font-bold text-[#10B981]">
                  {optimalMatches}/{optimalPath.length}
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {debrief.advice?.length > 0 ? (
          <div className="rounded-2xl bg-[#111111] border border-[#1F1F1F] p-6 mb-8">
            <h2
              className="font-bold text-[#F5F5F5] mb-1"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Personalized Takeaways
            </h2>
            <p className="text-[11px] text-[#6B6B6B] mb-6">
              Based on your decisions and retrieved financial education
            </p>
            <div className="space-y-4">
              {debrief.advice.map((item, i) => (
                <div
                  key={item.title || i}
                  className="rounded-xl border border-[#1F1F1F] bg-[#0D0D0D] p-4"
                >
                  <div className="text-sm font-semibold text-[#F5F5F5] mb-1">
                    {item.title}
                  </div>
                  <p className="text-[12px] text-[#A1A1A1] leading-relaxed">{item.body}</p>
                  {item.estimatedImpact ? (
                    <p className="text-[11px] text-[#F59E0B] mt-2">{item.estimatedImpact}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="rounded-2xl bg-[#111111] border border-[#1F1F1F] p-6 mb-8">
          <h2
            className="font-bold text-[#F5F5F5] mb-1"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Financial Report Card
          </h2>
          <p className="text-[11px] text-[#6B6B6B] mb-6">
            Scenario: {scenarioId || debrief.scenarioId} · Server-authoritative metrics
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl border border-[#1F1F1F] bg-[#0D0D0D] p-4">
              <div className="text-[11px] text-[#6B6B6B] uppercase tracking-widest mb-2">
                Resilience
              </div>
              <div className="text-2xl font-bold text-[#F5F5F5] mb-1">
                {Math.round(100 - (displayMetrics?.stressIndex ?? 0))}/100
              </div>
              <div className="text-[12px] text-[#A1A1A1]">
                Emergency cash buffer and stress profile after 10 rounds.
              </div>
            </div>
            <div className="rounded-xl border border-[#1F1F1F] bg-[#0D0D0D] p-4">
              <div className="text-[11px] text-[#6B6B6B] uppercase tracking-widest mb-2">
                Debt Fitness
              </div>
              <div className="text-2xl font-bold text-[#F5F5F5] mb-1">
                {Math.max(0, 100 - Math.round(displayMetrics?.debtToIncome ?? 0))}/100
              </div>
              <div className="text-[12px] text-[#A1A1A1]">
                Derived from debt-to-income and total debt load at finish.
              </div>
            </div>
            <div className="rounded-xl border border-[#1F1F1F] bg-[#0D0D0D] p-4">
              <div className="text-[11px] text-[#6B6B6B] uppercase tracking-widest mb-2">
                Decision Quality
              </div>
              <div className="text-2xl font-bold text-[#F5F5F5] mb-1">{matchRate}/100</div>
              <div className="text-[12px] text-[#A1A1A1]">
                Alignment with heuristic optimal path from your round history.
              </div>
            </div>
          </div>
          {displayMetrics?.inflationAnnual != null ? (
            <div className="mt-4 rounded-xl border border-[#1F1F1F] bg-[#0D0D0D] p-4">
              <div className="text-[11px] text-[#6B6B6B] uppercase tracking-widest mb-1">
                Macro Conditions At Finish
              </div>
              <div className="text-sm text-[#D1D1D1]">
                Inflation: {(displayMetrics.inflationAnnual * 100).toFixed(1)}% · Recession
                risk: {(displayMetrics.recessionProbAnnual * 100).toFixed(1)}% ({macroRiskLabel})
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex gap-4 justify-center flex-wrap">
          <button
            type="button"
            onClick={handlePlayAgain}
            className="px-8 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
            style={{
              background: "#F59E0B",
              color: "#0A0A0A",
              fontFamily: "var(--font-display)",
              boxShadow: "0 0 30px rgba(245,158,11,0.15)",
            }}
          >
            Play Again
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="px-8 py-3.5 rounded-xl font-semibold text-sm border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] flex items-center gap-2"
            style={{
              borderColor: "#2A2A2A",
              color: copied ? "#10B981" : "#A1A1A1",
              background: "#111111",
              fontFamily: "var(--font-display)",
            }}
          >
            {copied ? "Copied!" : "Share Result"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DebriefPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-[#6B6B6B]">
          Loading debrief...
        </div>
      }
    >
      <DebriefContent />
    </Suspense>
  );
}
