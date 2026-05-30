export function GameHeader({
  userName,
  exiting,
  onExitGame,
  onOpenAdvisor,
  onToggleSidebar,
}) {
  return (
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
            onClick={onExitGame}
            disabled={exiting}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2A2A2A] text-[#A1A1A1] text-[11px] font-medium hover:border-[#3A3A3A] hover:text-[#F5F5F5] transition-colors disabled:opacity-50"
            aria-label="Exit game"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M4.5 2.5L2 5v5.5h8V5L7.5 2.5H4.5Z"
                stroke="currentColor"
                strokeWidth="1.1"
                strokeLinejoin="round"
              />
              <path
                d="M5 6h2"
                stroke="currentColor"
                strokeWidth="1.1"
                strokeLinecap="round"
              />
            </svg>
            {exiting ? "Exiting…" : "Exit Game"}
          </button>
          <button
            onClick={onOpenAdvisor}
            className="lg:hidden px-2.5 py-1.5 rounded-lg border border-[#2A2A2A] text-[#A1A1A1] text-[11px] font-medium"
            aria-label="Open FinSim Advisor"
          >
            Advisor
          </button>
          <button
            onClick={onToggleSidebar}
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
  );
}
