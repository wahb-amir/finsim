"use client";

export function ChoiceCard({ choice, isSelected, onSelect, disabled }) {
  return (
    <button
      onClick={() => !disabled && onSelect(choice.id)}
      disabled={disabled}
      className={`
        relative w-full text-left rounded-xl p-5 border transition-all duration-200 cursor-pointer
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        ${
          isSelected
            ? "choice-card-selected border-[#F59E0B] bg-[#111111]"
            : "border-[#242424] bg-[#111111] choice-card-hover"
        }
      `}
      aria-pressed={isSelected}
    >
      {/* Selected checkmark */}
      {isSelected && (
        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#F59E0B] flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6L5 9L10 3" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      <div className="pr-8">
        {/* Choice label */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className="text-[11px] font-bold px-2 py-0.5 rounded"
            style={{
              background: isSelected ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.04)",
              color: isSelected ? "#F59E0B" : "#6B6B6B",
              border: `1px solid ${isSelected ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.06)"}`,
            }}
          >
            Option {choice.id}
          </span>
        </div>

        {/* Title */}
        <h3
          className="text-sm font-semibold mb-3 leading-snug"
          style={{ color: isSelected ? "#F5F5F5" : "#D1D1D1", fontFamily: "var(--font-display)" }}
        >
          {choice.title}
        </h3>

        {/* Bullets */}
        <ul className="space-y-1.5">
          {choice.bullets.map((bullet, i) => (
            <li key={i} className="flex items-start gap-2 text-[12px] text-[#A1A1A1] leading-relaxed">
              <span
                className="mt-1 flex-shrink-0 w-1 h-1 rounded-full"
                style={{ background: isSelected ? "#F59E0B" : "#3A3A3A" }}
              />
              {bullet}
            </li>
          ))}
        </ul>
      </div>
    </button>
  );
}
