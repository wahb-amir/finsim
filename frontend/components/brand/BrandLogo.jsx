const SIZES = {
  sm: { box: "h-6 w-6 rounded", icon: 10 },
  md: { box: "h-7 w-7 rounded-md", icon: 12 },
  lg: { box: "h-8 w-8 rounded-lg", icon: 14 },
};

export function BrandMark({ size = "md", className = "" }) {
  const s = SIZES[size] ?? SIZES.md;

  return (
    <div
      className={`flex flex-shrink-0 items-center justify-center bg-[#F59E0B] ${s.box} ${className}`}
      aria-hidden
    >
      <svg width={s.icon} height={s.icon} viewBox="0 0 10 10" fill="none">
        <path
          d="M5 1L6.2 4H9.5L7 5.8L8 9L5 7.2L2 9L3 5.8L0.5 4H3.8L5 1Z"
          fill="#0A0A0A"
        />
      </svg>
    </div>
  );
}

export function BrandLogo({
  size = "md",
  showWordmark = true,
  className = "",
  wordmarkClassName = "",
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <BrandMark size={size} />
      {showWordmark ? (
        <span
          className={`text-[15px] font-semibold tracking-tight text-[#F5F5F5] ${wordmarkClassName}`}
          style={{ fontFamily: "var(--font-display)" }}
        >
          FinSim
        </span>
      ) : null}
    </div>
  );
}
