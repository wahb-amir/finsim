export function CreditBadge({ score = 0 }) {
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
