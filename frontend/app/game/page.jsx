"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useGame } from "@/context/GameContext";
import { useAuth } from "../context/AuthContext";
import { MetricCard } from "@/components/ui/MetricCard";
import { SwipeDecisionCard } from "@/components/game/SwipeDecisionCard";
import { AdvisorPanel } from "@/components/ui/AdvisorPanel";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { RoundProgress } from "@/components/ui/RoundProgress";

const TOTAL_ROUNDS = 10;
const API = process.env.NEXT_PUBLIC_API_URL;

function formatCurrency(n = 0) {
  const value = Number(n) || 0;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  return `$${value.toLocaleString()}`;
}

function prettifyLabel(label) {
  if (!label) return "Unknown";
  return String(label)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function CreditBadge({ score = 0 }) {
  const safeScore = Number(score) || 0;
  const color =
    safeScore >= 700 ? "#10B981" : safeScore >= 600 ? "#F59E0B" : "#EF4444";
  const label = safeScore >= 700 ? "Good" : safeScore >= 600 ? "Fair" : "Poor";

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-bold" style={{ color }}>
        {safeScore}
      </span>
      <span
        className="text-[10px] px-1.5 py-0.5 rounded font-medium"
        style={{
          color,
          background: `${color}15`,
          border: `1px solid ${color}30`,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function GameContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const {
    playerName,
    setPlayerName,
    setGoal,
    hydrateGameView,
    selectChoice,
    recordRoundSnapshot,
    setDebriefData,
    currentRound,
    metrics,
    selectedChoice,
    currentEvent,
    ageYears,
    scenarioId,
  } = useGame();

  const routeSessionId =
    typeof params?.sessionId === "string" ? params.sessionId : null;
  const querySessionId = searchParams.get("sessionId");
  const [sessionId, setSessionId] = useState(
    routeSessionId || querySessionId || ""
  );

  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [savingRound, setSavingRound] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [advisorOpen, setAdvisorOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [exiting, setExiting] = useState(false);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const userName = user?.name || session?.playerName || playerName || "Player";

  const roundData = useMemo(() => {
    if (!currentEvent) return null;
    const displayAge = Math.max(18, Math.floor(ageYears));
    return {
      year: `Age ${displayAge}`,
      title: currentEvent.title,
      description: currentEvent.description,
      choices: [currentEvent.left, currentEvent.right],
      isCrisis: currentEvent.crisis,
    };
  }, [currentEvent, ageYears]);

  const isCrisis = roundData?.isCrisis || false;
  const remainingRounds = Math.max(0, TOTAL_ROUNDS - Math.min(currentRound, TOTAL_ROUNDS) + 1);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!sessionId) {
      const stored = typeof window !== "undefined"
        ? window.localStorage.getItem("gameSessionId")
        : "";
      if (stored) setSessionId(stored);
    }
  }, [sessionId]);

  useEffect(() => {
    const activeSessionId = routeSessionId || querySessionId || sessionId;
    if (!activeSessionId) {
      if (!authLoading) router.replace("/setup");
      return;
    }

    const loadSession = async () => {
      try {
        setLoadingSession(true);

        const res = await fetch(`${API}/game/session/${activeSessionId}`, {
          method: "GET",
          credentials: "include",
        });

        const data = await res.json();

        if (!res.ok || !data?.success || !data?.session) {
          router.replace("/setup");
          return;
        }

        const loadedSession = data.session;
        setSession(loadedSession);
        setSessionId(activeSessionId);

        if (typeof window !== "undefined") {
          window.localStorage.setItem("gameSessionId", activeSessionId);
        }

        if (loadedSession.status === "completed") {
          router.replace(`/debrief?sessionId=${activeSessionId}`);
          return;
        }

        if (loadedSession.status === "abandoned") {
          if (typeof window !== "undefined") {
            window.localStorage.removeItem("gameSessionId");
          }
          router.replace("/setup");
          return;
        }

        setPlayerName(loadedSession.playerName || user?.name || "Player");
        setGoal(loadedSession.goal || "");

        if (!data.event || !data.metrics) {
          showToast("error", "Session is missing simulation state");
          router.replace("/setup");
          return;
        }

        hydrateGameView({
          currentRound: data.currentRound ?? loadedSession.currentRound,
          metrics: data.metrics,
          event: data.event,
          narrative: data.narrative,
          scenarioId: data.scenarioId ?? loadedSession.scenarioId,
          ageYears: data.ageYears,
        });
      } catch (err) {
        console.error("[loadSession]", err);
        router.replace("/setup");
      } finally {
        setLoadingSession(false);
      }
    };

    loadSession();
  }, [
    API,
    authLoading,
    hydrateGameView,
    querySessionId,
    routeSessionId,
    router,
    sessionId,
    setGoal,
    setPlayerName,
    user?.name,
  ]);

  const handleConfirm = useCallback(async () => {
    if (!selectedChoice || isConfirming || savingRound || !currentEvent || !sessionId) {
      return;
    }

    setIsConfirming(true);
    setSavingRound(true);

    try {
      const res = await fetch(`${API}/game/session/round`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          sessionId,
          choice: selectedChoice,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Failed to submit round");
      }

      recordRoundSnapshot({
        round: currentRound,
        choice: selectedChoice,
        eventId: currentEvent.id,
        eventTitle: currentEvent.title,
        metricSnapshot: { ...metrics },
      });

      if (data.completed || data.status === "completed") {
        setDebriefData(null);
        router.push(`/debrief?sessionId=${sessionId}`);
        return;
      }

      hydrateGameView({
        currentRound: data.currentRound,
        metrics: data.metrics,
        event: data.event,
        narrative: data.narrative,
        debrief: data.debrief,
        ageYears: data.ageYears,
        scenarioId: data.scenarioId,
      });
    } catch (e) {
      console.error(e);
      showToast("error", e.message || "Could not apply decision");
    } finally {
      setIsConfirming(false);
      setSavingRound(false);
    }
  }, [
    API,
    selectedChoice,
    isConfirming,
    savingRound,
    currentEvent,
    currentRound,
    sessionId,
    metrics,
    recordRoundSnapshot,
    hydrateGameView,
    router,
    setDebriefData,
  ]);

  const handleExitGame = useCallback(async () => {
    if (!sessionId || exiting) return;
    const confirmed = window.confirm(
      "Exit this game? Your progress is saved and you can start a new simulation from setup.",
    );
    if (!confirmed) return;

    setExiting(true);
    try {
      const res = await fetch(`${API}/game/session/${sessionId}/abandon`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Could not exit session");
      }
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("gameSessionId");
      }
      router.push("/setup");
    } catch (e) {
      console.error(e);
      showToast("error", e.message || "Could not exit game");
    } finally {
      setExiting(false);
    }
  }, [API, sessionId, exiting, router]);

  if (authLoading || loadingSession) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-[#F59E0B]">
        <div className="text-center">
          <div className="mb-3 text-2xl">Loading game...</div>
          <div className="text-sm text-[#6B6B6B]">
            Restoring your session
          </div>
        </div>
      </div>
    );
  }

  if (!user || !session || !currentEvent || !roundData) return null;

  return (
    <div className="h-screen bg-[#0A0A0A] flex flex-col overflow-hidden">
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl text-sm font-medium backdrop-blur-xl border transition-all duration-300 shadow-[0_0_30px_rgba(0,0,0,0.35)] ${
            toast.type === "success"
              ? "bg-[#0F172A]/90 border-[#10B981]/30 text-[#10B981]"
              : "bg-[#0F172A]/90 border-red-500/30 text-red-400"
          }`}
        >
          {toast.message}
        </div>
      )}

      <header className="flex-shrink-0 h-12 border-b border-[#1A1A1A] flex items-center px-4 gap-4 bg-[#0A0A0A] z-30">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#F59E0B] flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path
                d="M5 1L6.2 4H9.5L7 5.8L8 9L5 7.2L2 9L3 5.8L0.5 4H3.8L5 1Z"
                fill="#0A0A0A"
              />
            </svg>
          </div>
          <span
            className="text-[13px] font-bold tracking-tight text-[#F5F5F5]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            FinSim
          </span>
        </div>
        <div className="h-4 w-px bg-[#2A2A2A]" />
        <span className="text-[11px] text-[#6B6B6B]">{userName}</span>
        <div className="ml-auto">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExitGame}
              disabled={exiting}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2A2A2A] text-[#A1A1A1] text-[11px] font-medium hover:border-[#3A3A3A] hover:text-[#F5F5F5] transition-colors disabled:opacity-50"
              aria-label="Exit game"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path
                  d="M4.5 2.5L2 5v5.5h8V5L7.5 2.5H4.5Z"
                  stroke="currentColor"
                  strokeWidth="1.1"
                  strokeLinejoin="round"
                />
                <path d="M5 6h2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
              </svg>
              {exiting ? "Exiting…" : "Exit Game"}
            </button>
            <button
              onClick={() => setAdvisorOpen(true)}
              className="lg:hidden px-2.5 py-1.5 rounded-lg border border-[#2A2A2A] text-[#A1A1A1] text-[11px] font-medium"
              aria-label="Open FinSim Advisor"
            >
              Advisor
            </button>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 rounded-lg border border-[#2A2A2A] text-[#6B6B6B]"
              aria-label="Toggle metrics sidebar"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M1 3H13M1 7H13M1 11H13"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside
          className={`
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            md:translate-x-0
            fixed md:relative top-12 md:top-auto left-0 md:left-auto
            h-[calc(100vh-3rem)] md:h-auto
            w-72 md:w-72 flex-shrink-0
            bg-[#0A0A0A] md:bg-transparent border-r border-[#1A1A1A]
            overflow-y-auto
            flex flex-col
            z-20 transition-transform duration-300
            p-3 gap-2
          `}
        >
          <div className="rounded-2xl bg-[#111111] border border-[#1F1F1F] p-4 mb-1">
            <div
              className="text-sm font-bold text-[#F5F5F5] truncate"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {userName}
            </div>

            <div className="mt-2 text-[11px] text-[#6B6B6B] space-y-1">
              <div>{roundData.year} · Round {currentRound} of {TOTAL_ROUNDS}</div>
              <div>Career: {prettifyLabel(session.career)}</div>
              <div>Climate: {prettifyLabel(session.climateLabel)}</div>
              <div>Goal: {prettifyLabel(session.goal)}</div>
              <div>Starting salary: {formatCurrency(session.startSalary)}</div>
            </div>

            <div className="mt-3 flex flex-col gap-2">
              <button
                type="button"
                className="text-[13px] bg-[#F59E0B] hover:bg-[#ffb11f] text-black px-4 py-2 font-semibold rounded-[10px] transition-colors"
                onClick={() => router.push("/profile")}
              >
                Visit Profile
              </button>
              <button
                type="button"
                disabled={exiting}
                onClick={handleExitGame}
                className="text-[12px] px-4 py-2 font-medium rounded-[10px] border border-[#2A2A2A] text-[#A1A1A1] hover:border-[#3A3A3A] hover:text-[#F5F5F5] transition-colors disabled:opacity-50"
              >
                {exiting ? "Saving & exiting…" : "Exit Game"}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <MetricCard
              label="Monthly Income"
              value={formatCurrency(metrics.monthlyIncome)}
              compact
            />
            <MetricCard
              label="Monthly Expenses"
              value={formatCurrency(metrics.monthlyExpenses)}
              compact
            />
            <MetricCard
              label="Savings Balance"
              value={formatCurrency(metrics.savingsBalance)}
              colorCode={
                metrics.savingsBalance > 5000
                  ? "#10B981"
                  : metrics.savingsBalance > 1000
                    ? "#F59E0B"
                    : "#EF4444"
              }
              compact
            />
            <MetricCard
              label="Total Debt"
              value={formatCurrency(metrics.totalDebt)}
              colorCode={
                metrics.totalDebt === 0
                  ? "#10B981"
                  : metrics.totalDebt < 10000
                    ? "#F59E0B"
                    : "#EF4444"
              }
              compact
            />

            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#111111] border border-[#1F1F1F]">
              <span className="text-[11px] text-[#6B6B6B] uppercase tracking-wider font-medium">
                Credit Score
              </span>
              <CreditBadge score={metrics.creditScore} />
            </div>

            <MetricCard
              label="Retirement"
              value={formatCurrency(metrics.retirementBalance)}
              colorCode={metrics.retirementBalance > 5000 ? "#10B981" : "#A1A1A1"}
              compact
            />
            <MetricCard
              label="Debt-to-Income"
              value={`${Math.round(metrics.debtToIncome)}%`}
              colorCode={
                metrics.debtToIncome < 20
                  ? "#10B981"
                  : metrics.debtToIncome < 40
                    ? "#F59E0B"
                    : "#EF4444"
              }
              compact
            />
            <MetricCard
              label="Stress Index"
              value={metrics.stressIndex}
              isProgress
              compact
            />
          </div>
        </aside>

        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/60 z-10 top-12"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main
          className={`
            flex-1 flex flex-col overflow-hidden min-w-0
            transition-all duration-300
            ${isCrisis ? "crisis-bg" : ""}
          `}
        >
          {isCrisis && (
            <div className="flex-shrink-0 h-0.5 bg-gradient-to-r from-transparent via-[#EF4444]/40 to-transparent" />
          )}

          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
            <div className="flex items-start gap-3 mb-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span
                    className="text-[11px] font-bold px-2 py-0.5 rounded"
                    style={{
                      background: "rgba(245,158,11,0.1)",
                      color: "#F59E0B",
                      border: "1px solid rgba(245,158,11,0.2)",
                    }}
                  >
                    ROUND {currentRound}
                  </span>
                  <span className="text-[11px] text-[#6B6B6B]">
                    {roundData.year}
                  </span>
                  {isCrisis && (
                    <span
                      className="text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-1"
                      style={{
                        background: "rgba(239,68,68,0.12)",
                        color: "#EF4444",
                        border: "1px solid rgba(239,68,68,0.25)",
                      }}
                      role="alert"
                    >
                      <span aria-hidden="true">⚠</span> CRISIS
                    </span>
                  )}
                </div>

                <h1
                  className="text-xl md:text-2xl font-bold text-[#F5F5F5] leading-tight"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {roundData.title}
                </h1>
              </div>
            </div>

            <div
              className="rounded-2xl p-4 mb-6 text-sm text-[#A1A1A1] leading-relaxed border"
              style={{
                background: isCrisis
                  ? "rgba(239,68,68,0.04)"
                  : "rgba(17,17,17,0.8)",
                borderColor: isCrisis ? "rgba(239,68,68,0.12)" : "#1F1F1F",
              }}
            >
              {roundData.description}
            </div>

            <div className="mb-6">
              <SwipeDecisionCard
                event={currentEvent}
                selectedChoice={selectedChoice}
                disabled={isConfirming || savingRound}
                onChoose={selectChoice}
              />
              {selectedChoice ? (
                <p className="mt-3 text-center text-xs text-[#6B6B6B]">
                  Selected:{" "}
                  {selectedChoice === "left"
                    ? currentEvent.left.title
                    : currentEvent.right.title}
                </p>
              ) : null}
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleConfirm}
                disabled={!selectedChoice || isConfirming || savingRound}
                className="px-10 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] flex items-center gap-2"
                style={{
                  background: selectedChoice ? "#F59E0B" : "#1A1A1A",
                  color: selectedChoice ? "#0A0A0A" : "#4A4A4A",
                  border: selectedChoice ? "none" : "1px solid #2A2A2A",
                  fontFamily: "var(--font-display)",
                  boxShadow: selectedChoice
                    ? "0 0 30px rgba(245,158,11,0.15)"
                    : "none",
                  transition: "all 0.25s ease",
                }}
                aria-busy={isConfirming || savingRound}
              >
                {isConfirming || savingRound ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/20 border-t-black/60 rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    {selectedChoice ? "Confirm Decision" : "Select a choice first"}
                    {selectedChoice && (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path
                          d="M3 7H11M11 7L7 3M11 7L7 11"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        </main>

        <aside className="hidden lg:flex w-80 flex-shrink-0 border-l border-[#1A1A1A] flex-col p-4 bg-[#0A0A0A] overflow-hidden">
          <AdvisorPanel round={currentRound} metrics={metrics} />
        </aside>
      </div>

      <footer className="flex-shrink-0 h-14 border-t border-[#1A1A1A] bg-[#0A0A0A] flex items-center justify-center px-4 gap-4">
        <div className="flex items-center gap-2 flex-shrink-0 text-[11px] text-[#4A4A4A]">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1" />
            <path
              d="M6 4V7M6 8.5V9"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
          Round progress
        </div>

        <RoundProgress currentRound={Math.min(currentRound, TOTAL_ROUNDS)} totalRounds={TOTAL_ROUNDS} />

        <div className="flex-shrink-0 text-[11px] text-[#4A4A4A]">
          {remainingRounds} left
        </div>
      </footer>

      <BottomSheet
        open={advisorOpen}
        onClose={() => setAdvisorOpen(false)}
        title="FinSim Advisor"
        description="Reflect on this round and ask follow-up questions."
      >
        <div className="h-[56vh] min-h-[340px]">
          <AdvisorPanel round={currentRound} metrics={metrics} />
        </div>
      </BottomSheet>
    </div>
  );
}

export default function GamePage() {
  return <GameContent />;
}