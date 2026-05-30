export function GameToast({ toast }) {
  if (!toast) return null;

  return (
    <div
      className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl text-sm font-medium backdrop-blur-xl border transition-all duration-300 shadow-[0_0_30px_rgba(0,0,0,0.35)] ${
        toast.type === "success"
          ? "bg-[#0F172A]/90 border-[#10B981]/30 text-[#10B981]"
          : "bg-[#0F172A]/90 border-red-500/30 text-red-400"
      }`}
    >
      {toast.message}
    </div>
  );
}
