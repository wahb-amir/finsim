"use client";

export function RoundProgress({ currentRound, totalRounds = 10 }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: totalRounds }, (_, i) => {
        const roundNum = i + 1;
        const isCompleted = roundNum < currentRound;
        const isCurrent = roundNum === currentRound;

        return (
          <div
            key={roundNum}
            className={`relative flex items-center justify-center transition-all duration-300 ${
              isCurrent ? "w-8 h-8" : "w-6 h-6"
            }`}
            title={`Round ${roundNum}`}
          >
            <div
              className={`
                rounded-full transition-all duration-300 flex items-center justify-center
                ${
                  isCurrent
                    ? "w-8 h-8 bg-[#F59E0B] animate-amber-pulse"
                    : isCompleted
                      ? "w-5 h-5 bg-[#2A2A2A] border border-[#10B981]/30"
                      : "w-5 h-5 bg-[#1A1A1A] border border-[#2A2A2A]"
                }
              `}
            >
              {isCurrent ? (
                <span className="text-[10px] font-bold text-black">
                  {roundNum}
                </span>
              ) : isCompleted ? (
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path
                    d="M1.5 4L3.5 6L6.5 2"
                    stroke="#10B981"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
