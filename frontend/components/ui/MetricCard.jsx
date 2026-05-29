"use client";

export function MetricCard({
  label,
  value,
  colorCode,
  isProgress = false,
  compact = false,
}) {
  if (compact) {
    return (
      <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#111111] border border-[#1F1F1F]">
        <span className="text-[11px] text-[#6B6B6B] uppercase tracking-wider font-medium leading-tight">
          {label}
        </span>
        {isProgress ? (
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 rounded-full bg-[#1F1F1F] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, Math.max(0, value))}%`,
                  background:
                    value < 30 ? "#10B981" : value < 60 ? "#F59E0B" : "#EF4444",
                }}
              />
            </div>
            <span
              className="text-xs font-semibold"
              style={{
                color:
                  value < 30 ? "#10B981" : value < 60 ? "#F59E0B" : "#EF4444",
              }}
            >
              {Math.round(value)}
            </span>
          </div>
        ) : (
          <span
            className="text-xs font-semibold"
            style={{ color: colorCode || "#F5F5F5" }}
          >
            {value}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-[#111111] border border-[#1F1F1F] p-4 hover:border-[#2A2A2A] transition-colors duration-200">
      <div className="text-[11px] text-[#6B6B6B] uppercase tracking-widest font-medium mb-1.5">
        {label}
      </div>
      {isProgress ? (
        <div className="space-y-1">
          <div
            className="text-base font-semibold"
            style={{
              color:
                value < 30 ? "#10B981" : value < 60 ? "#F59E0B" : "#EF4444",
            }}
          >
            {Math.round(value)}
            <span className="text-[10px] text-[#6B6B6B] ml-1">/100</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[#1F1F1F] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(100, Math.max(0, value))}%`,
                background:
                  value < 30 ? "#10B981" : value < 60 ? "#F59E0B" : "#EF4444",
              }}
            />
          </div>
        </div>
      ) : (
        <div
          className="text-base font-semibold truncate"
          style={{ color: colorCode || "#F5F5F5" }}
        >
          {value}
        </div>
      )}
    </div>
  );
}
