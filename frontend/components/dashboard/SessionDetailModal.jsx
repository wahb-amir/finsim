"use client";

import { useEffect, useCallback } from "react";
import { formatCurrency, prettifyLabel } from "@/lib/format";

const STATUS_CONFIG = {
  completed: {
    label: "Completed",
    color: "#10B981",
    bg: "rgba(16,185,129,0.1)",
    border: "rgba(16,185,129,0.25)",
  },
  active: {
    label: "In Progress",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.25)",
  },
  abandoned: {
    label: "Abandoned",
    color: "#6B6B6B",
    bg: "rgba(107,107,107,0.1)",
    border: "rgba(107,107,107,0.25)",
  },
};

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.abandoned;
  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
      style={{
        color: config.color,
        background: config.bg,
        borderColor: config.border,
      }}
    >
      {config.label}
    </span>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function SessionDetailModal({
  session,
  loading,
  onClose,
  onViewDebrief,
  onContinue,
}) {
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") onClose?.();
    },
    [onClose],
  );

  useEffect(() => {
    if (!session) return;
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [session, handleKeyDown]);

  if (!session) return null;

  const rounds = session.rounds || [];
  const netWorth = session.finalMetrics?.netWorth;
  const score =
    session.debriefData?.headline?.score ?? session.debriefData?.score;
  const scoreLabel =
    session.debriefData?.headline?.scoreLabel ??
    session.debriefData?.scoreLabel;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center px-0 sm:px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-detail-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close session details"
      />

      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-[#2A2A2A] bg-[#0F0F0F] shadow-2xl sm:rounded-3xl">
        <div className="flex-shrink-0 border-b border-[#1F1F1F] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={session.status} />
                {scoreLabel ? (
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[#6B6B6B]">
                    {scoreLabel}
                  </span>
                ) : null}
              </div>
              <h2
                id="session-detail-title"
                className="text-2xl font-bold text-white"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {session.career || "Simulation Run"}
              </h2>
              <p className="mt-1 text-sm text-[#6B6B6B]">
                {formatDate(session.createdAt)} · Round{" "}
                {Math.min(session.currentRound - 1, 10)}/10
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#2A2A2A] p-2 text-[#6B6B6B] transition hover:border-[#444] hover:text-white"
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M4 4l8 8M12 4l-8 8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Goal", value: prettifyLabel(session.goal) },
              { label: "Climate", value: session.climateLabel || "—" },
              {
                label: "Start Salary",
                value: session.startSalary
                  ? `$${Number(session.startSalary).toLocaleString()}`
                  : "—",
              },
              {
                label: "Net Worth",
                value:
                  netWorth != null
                    ? `${netWorth >= 0 ? "+" : ""}$${netWorth.toLocaleString()}`
                    : "—",
                highlight: netWorth != null,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-[#1F1F1F] bg-[#0A0A0A] p-3"
              >
                <div className="text-[10px] uppercase tracking-widest text-[#6B6B6B]">
                  {item.label}
                </div>
                <div
                  className="mt-1 text-sm font-semibold"
                  style={{
                    color: item.highlight
                      ? netWorth >= 0
                        ? "#10B981"
                        : "#EF4444"
                      : "#F5F5F5",
                  }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {session.aiSummary ? (
            <p className="mt-4 rounded-xl border border-[#1F1F1F] bg-[#0A0A0A] p-4 text-sm italic leading-relaxed text-[#A1A1A1]">
              &ldquo;{session.aiSummary}&rdquo;
            </p>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-[#6B6B6B]">
            Your Decisions
          </h3>

          {loading ? (
            <div className="py-12 text-center text-sm text-[#6B6B6B]">
              Loading session details…
            </div>
          ) : rounds.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#2A2A2A] py-12 text-center text-sm text-[#6B6B6B]">
              No decisions recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {rounds.map((round) => (
                <div
                  key={round.round}
                  className="rounded-xl border border-[#1F1F1F] bg-[#0A0A0A] p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-[#2A2A2A] bg-[#161616] text-xs font-bold text-[#F59E0B]">
                      {round.round}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-[#F5F5F5]">
                        {round.eventTitle || `Round ${round.round}`}
                      </div>
                      <div className="mt-1 text-sm text-[#10B981]">
                        Chose:{" "}
                        {round.selectedOptionTitle || `Option ${round.choice}`}
                      </div>
                      {round.metricsAfter?.netWorth != null ? (
                        <div className="mt-2 text-[11px] text-[#6B6B6B]">
                          Net worth after:{" "}
                          {formatCurrency(round.metricsAfter.netWorth)}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 border-t border-[#1F1F1F] p-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            {session.status === "completed" ? (
              <button
                type="button"
                onClick={() => onViewDebrief?.(session._id)}
                className="flex-1 rounded-xl bg-[#F59E0B] px-5 py-3 text-sm font-semibold text-black transition hover:opacity-95"
              >
                View Full Debrief
                {score != null ? ` · Score ${score}` : ""}
              </button>
            ) : session.status === "active" ? (
              <button
                type="button"
                onClick={() => onContinue?.(session._id)}
                className="flex-1 rounded-xl bg-[#F59E0B] px-5 py-3 text-sm font-semibold text-black transition hover:opacity-95"
              >
                Continue Game
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-[#2A2A2A] bg-[#111111] px-5 py-3 text-sm font-semibold text-white transition hover:border-[#444]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
