import { RoundProgress } from "@/components/ui/RoundProgress";
import { TOTAL_ROUNDS } from "@/components/game/constants";

export function GameFooter({ currentRound, remainingRounds }) {
  return (
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

      <RoundProgress
        currentRound={Math.min(currentRound, TOTAL_ROUNDS)}
        totalRounds={TOTAL_ROUNDS}
      />

      <div className="flex-shrink-0 text-[11px] text-[#4A4A4A]">
        {remainingRounds} left
      </div>
    </footer>
  );
}
