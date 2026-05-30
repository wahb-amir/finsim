import { SwipeDecisionCard } from "@/components/game/SwipeDecisionCard";

export function GameRoundPanel({
  roundData,
  currentRound,
  currentEvent,
  isCrisis,
  selectedChoice,
  isConfirming,
  savingRound,
  onChoose,
  onConfirm,
}) {
  return (
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
              <span className="text-[11px] text-[#6B6B6B]">{roundData.year}</span>
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
            background: isCrisis ? "rgba(239,68,68,0.04)" : "rgba(17,17,17,0.8)",
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
            onChoose={onChoose}
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
            onClick={onConfirm}
            disabled={!selectedChoice || isConfirming || savingRound}
            className="px-10 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] flex items-center gap-2"
            style={{
              background: selectedChoice ? "#F59E0B" : "#1A1A1A",
              color: selectedChoice ? "#0A0A0A" : "#4A4A4A",
              border: selectedChoice ? "none" : "1px solid #2A2A2A",
              fontFamily: "var(--font-display)",
              boxShadow: selectedChoice ? "0 0 30px rgba(245,158,11,0.15)" : "none",
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
  );
}
