export function StatCard({ number, label, sublabel, color }) {
  return (
    <div className="rounded-2xl bg-[#111111] border border-[#1F1F1F] p-6 hover:border-[#2A2A2A] transition-colors duration-200 relative overflow-hidden">
      {/* Subtle corner accent */}
      <div
        className="absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-5"
        style={{ background: color || "#F59E0B" }}
      />

      <div
        className="text-3xl font-bold mb-1 tracking-tight"
        style={{
          color: color || "#F59E0B",
          fontFamily: "var(--font-display)",
        }}
      >
        {number}
      </div>
      <div className="text-sm font-medium text-[#F5F5F5] mb-0.5">{label}</div>
      {sublabel && <div className="text-xs text-[#6B6B6B]">{sublabel}</div>}
    </div>
  );
}
