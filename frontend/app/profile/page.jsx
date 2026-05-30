"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const getInitials = (name) => {
  if (!name) return "--";
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0].toUpperCase())
    .join("");
};

const LogoutModal = ({ onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div
      className="absolute inset-0 bg-[#080808]/80 backdrop-blur-sm"
      onClick={onCancel}
      style={{ animation: "fadeIn 0.2s ease-out both" }}
    />
    <div
      className="relative z-10 w-[360px] bg-[#111111] border border-[#1f1f1f] rounded-2xl p-7 shadow-2xl"
      style={{ animation: "slideUp 0.25s cubic-bezier(0.16,1,0.3,1) both" }}
    >
      <div
        className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </div>

      <div className="font-display text-[1.15rem] font-bold tracking-[-0.02em] mb-1.5" style={{ fontFamily: "'Syne', sans-serif" }}>
        Sign out?
      </div>
      <div className="text-[0.82rem] text-[#6b6b6b] leading-relaxed mb-7">
        Your session will end. Any active game in progress will be saved automatically.
      </div>

      <div className="flex flex-col gap-2.5">
        <button
          onClick={onConfirm}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-[0.82rem] font-medium px-4 py-2.5 rounded-lg transition-all duration-200 hover:bg-red-500/20 hover:border-red-500/50 disabled:opacity-40 cursor-pointer"
        >
          {loading ? (
            <>
              <span className="spin w-3.5 h-3.5 rounded-full border-2 border-red-400/30 border-t-red-400 inline-block" />
              Signing out…
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Yes, sign me out
            </>
          )}
        </button>
        <button
          onClick={onCancel}
          disabled={loading}
          className="w-full text-[0.82rem] text-[#6b6b6b] px-4 py-2.5 rounded-lg border border-[#1f1f1f] bg-[#161616] hover:border-[#2a2a2a] hover:text-[#a1a1a1] transition-all duration-200 cursor-pointer disabled:opacity-40"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
);

const MetricCard = ({ label, value, variant, badge, badgeType, sub, icon, delay }) => {
  const variantStyles = {
    amber: {
      card: "border-amber-500/15 bg-gradient-to-br from-amber-500/[0.04] to-transparent hover:border-amber-500/35",
      value: "text-amber-400",
    },
    red: {
      card: "border-red-500/10 bg-gradient-to-br from-red-500/[0.04] to-transparent hover:border-red-500/30",
      value: "text-red-400",
    },
    green: {
      card: "border-emerald-500/10 bg-gradient-to-br from-emerald-500/[0.04] to-transparent hover:border-emerald-500/30",
      value: "text-emerald-400",
    },
    blue: {
      card: "border-blue-500/10 bg-gradient-to-br from-blue-500/[0.04] to-transparent hover:border-blue-500/30",
      value: "text-blue-400",
    },
  };

  const badgeStyles = {
    up: "bg-emerald-500/10 text-emerald-400",
    down: "bg-red-500/10 text-red-400",
    neutral: "bg-white/5 text-[#6b6b6b]",
  };

  const s = variantStyles[variant] ?? variantStyles.amber;

  return (
    <div
      className={`rounded-xl border p-5 transition-all duration-300 hover:-translate-y-0.5 animate-fade-in-up ${s.card}`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <div className="text-sm mb-2 opacity-50">{icon}</div>
      <div className="font-mono text-[0.68rem] uppercase tracking-widest text-[#6b6b6b] mb-1.5">{label}</div>
      <div className={`font-display text-[1.85rem] font-extrabold tracking-[-0.04em] leading-none ${s.value}`}>
        {value}
      </div>
      <div className="flex items-center gap-1.5 mt-2">
        <span className={`text-[0.65rem] font-mono px-1.5 py-0.5 rounded ${badgeStyles[badgeType]}`}>{badge}</span>
        <span className="text-[0.72rem] text-[#6b6b6b]">{sub}</span>
      </div>
    </div>
  );
};

const statusStyles = {
  completed: { dot: "bg-emerald-400", label: "text-emerald-400", bg: "bg-emerald-500/8 border-emerald-500/20", text: "Completed" },
  active: { dot: "bg-amber-400", label: "text-amber-400", bg: "bg-amber-500/8 border-amber-500/20", text: "In Progress" },
  abandoned: { dot: "bg-[#6b6b6b]", label: "text-[#6b6b6b]", bg: "bg-white/5 border-white/10", text: "Abandoned" },
};

const SessionRow = ({ session, index }) => {
  const s = statusStyles[session.status] ?? statusStyles.abandoned;
  const netWorth = session.finalMetrics?.netWorth;
  const rounds = session.rounds?.length ?? 0;
  const career = session.career ?? "—";
  const goal = session.goal ?? "—";
  const date = session.createdAt ? new Date(session.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

  return (
    <div
      className="flex items-center gap-4 px-4 py-3.5 bg-[#111111] border border-[#1f1f1f] rounded-xl hover:border-[#2a2a2a] transition-all duration-200 animate-fade-in-up"
      style={{ animationDelay: `${560 + index * 50}ms`, animationFillMode: "both" }}
    >
      <div className="w-8 h-8 rounded-lg bg-[#1c1c1c] border border-[#242424] flex items-center justify-center font-mono text-[0.7rem] text-[#6b6b6b] flex-shrink-0">
        {index + 1}
      </div>

      <div className="flex-1 min-w-0 grid grid-cols-[1fr_auto_auto_auto] items-center gap-4">
        <div className="min-w-0">
          <div className="text-[0.82rem] text-[#f5f5f5] capitalize truncate">{career.replace(/-/g, " ")}</div>
          <div className="font-mono text-[0.68rem] text-[#6b6b6b] mt-0.5 capitalize">{goal.replace(/-/g, " ")} · {date}</div>
        </div>

        <div className="text-right">
          <div className="font-mono text-[0.75rem] text-[#a1a1a1]">Round</div>
          <div className="font-display text-[0.95rem] font-bold text-amber-400">{rounds}</div>
        </div>

        <div className="text-right">
          <div className="font-mono text-[0.75rem] text-[#a1a1a1]">Net Worth</div>
          <div className={`font-display text-[0.95rem] font-bold ${netWorth ? "text-emerald-400" : "text-[#6b6b6b]"}`}>
            {netWorth ? `$${Number(netWorth).toLocaleString()}` : "—"}
          </div>
        </div>

        <div className={`inline-flex items-center gap-1.5 border text-[0.68rem] font-mono px-2.5 py-1 rounded-full ${s.bg} ${s.label}`}>
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
          {s.text}
        </div>
      </div>
    </div>
  );
};

const Profile = () => {
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL;

  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [gameData, setGameData] = useState([]);
  const [gameLoading, setGameLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetch(`${API}/auth/me`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setUser(d.user))
      .catch(() => setUser(null))
      .finally(() => setUserLoading(false));
  }, []);

  useEffect(() => {
    fetch(`${API}/game/sessions/userData`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setGameData(d.gameData ?? []))
      .catch(() => setGameData([]))
      .finally(() => setGameLoading(false));
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch(`${API}/auth/logout`, { method: "POST", credentials: "include" });
      window.location.href = "/auth";
    } catch {
      setLoggingOut(false);
    }
  };

  const completed = gameData.filter((g) => g.status === "completed");
  const active = gameData.filter((g) => g.status === "active");
  const abandoned = gameData.filter((g) => g.status === "abandoned");

  const totalNetWorth = completed.reduce((sum, g) => sum + (g.finalMetrics?.netWorth ?? 0), 0);
  const totalRounds = gameData.reduce((sum, g) => sum + (g.rounds?.length ?? 0), 0);
  const bestNetWorth = completed.length ? Math.max(...completed.map((g) => g.finalMetrics?.netWorth ?? 0)) : null;
  const winRate = gameData.length ? Math.round((completed.length / gameData.length) * 100) : 0;

  const metrics = [
    {
      label: "Total Sessions",
      value: gameLoading ? "…" : gameData.length,
      variant: "amber",
      badge: `${completed.length} done`,
      badgeType: "up",
      sub: "all time",
      icon: "◈",
      delay: 300,
    },
    {
      label: "Completed",
      value: gameLoading ? "…" : completed.length,
      variant: "green",
      badge: `${winRate}% rate`,
      badgeType: "up",
      sub: "finished games",
      icon: "◉",
      delay: 360,
    },
    {
      label: "Active",
      value: gameLoading ? "…" : active.length,
      variant: "blue",
      badge: active.length > 0 ? "in progress" : "none",
      badgeType: active.length > 0 ? "up" : "neutral",
      sub: "ongoing",
      icon: "◧",
      delay: 420,
    },
    {
      label: "Abandoned",
      value: gameLoading ? "…" : abandoned.length,
      variant: "red",
      badge: abandoned.length > 0 ? "unfinished" : "clean",
      badgeType: abandoned.length > 0 ? "down" : "neutral",
      sub: "sessions",
      icon: "◫",
      delay: 480,
    },
    {
      label: "Best Net Worth",
      value: gameLoading ? "…" : bestNetWorth ? `$${Number(bestNetWorth).toLocaleString()}` : "—",
      variant: "amber",
      badge: completed.length ? "peak" : "no data",
      badgeType: bestNetWorth ? "up" : "neutral",
      sub: "across games",
      icon: "▤",
      delay: 540,
    },
    {
      label: "Total Rounds",
      value: gameLoading ? "…" : totalRounds,
      variant: "green",
      badge: `~${gameData.length ? Math.round(totalRounds / gameData.length) : 0} avg`,
      badgeType: "neutral",
      sub: "decisions made",
      icon: "◌",
      delay: 600,
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500&family=JetBrains+Mono:wght@300;400&display=swap');
        .font-display { font-family: 'Syne', system-ui, sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px) scale(0.97) } to { opacity: 1; transform: translateY(0) scale(1) } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(18px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes greenPulse { 0%,100%{ opacity:1;transform:scale(1) } 50%{ opacity:.5;transform:scale(.85) } }
        @keyframes spin { to { transform: rotate(360deg) } }
        .animate-fade-in-up { animation: fadeInUp 0.55s ease-out both; }
        .status-dot { animation: greenPulse 2s ease-in-out infinite; }
        .spin { animation: spin 0.9s linear infinite; }
      `}</style>

      {showLogoutModal && (
        <LogoutModal
          onConfirm={handleLogout}
          onCancel={() => !loggingOut && setShowLogoutModal(false)}
          loading={loggingOut}
        />
      )}

      <div className="max-w-[1100px] mx-auto px-6 py-10 font-body" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <div className="flex items-center justify-between mb-12 animate-fade-in-up">
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="text-[11px] text-[#6B6B6B] transition hover:text-[#F59E0B]"
            >
              ← Back to Dashboard
            </button>
            <div className="font-display text-lg font-bold tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
              fin<span className="text-amber-400">.</span>arc
            </div>
          </div>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-2 bg-[#111111] border border-[#1f1f1f] text-[#a1a1a1] text-[0.8rem] px-4 py-2 rounded-md cursor-pointer transition-all duration-250 hover:border-red-500/60 hover:text-red-400 hover:bg-red-500/10"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </button>
        </div>

        <div
          className="grid grid-cols-[1fr_auto] items-start gap-8 mb-10 p-8 bg-[#111111] border border-[#1f1f1f] rounded-2xl relative overflow-hidden animate-fade-in-up"
          style={{ animationDelay: "60ms", background: "radial-gradient(ellipse at top right, rgba(245,158,11,0.05) 0%, #111111 60%)" }}
        >
          <div className="flex flex-col gap-1.5">
            <div className="font-mono text-[0.68rem] uppercase tracking-[0.1em] text-[#6b6b6b] mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Welcome back
            </div>

            {userLoading ? (
              <div className="flex items-center gap-2 text-[#6b6b6b] text-sm py-1">
                <span className="spin inline-block w-4 h-4 rounded-full border-2 border-[#2a2a2a] border-t-amber-400" />
                Loading profile…
              </div>
            ) : (
              <>
                <div className="font-display text-[2.2rem] font-extrabold tracking-[-0.03em] leading-none" style={{ fontFamily: "'Syne', sans-serif" }}>
                  {user?.name ?? "Guest User"}
                </div>
                <div className="text-[0.82rem] text-[#6b6b6b] font-light mt-1 tracking-[0.01em]">
                  {user?.email ?? "Not authenticated"}
                </div>
              </>
            )}

            <div className="inline-flex items-center gap-1.5 bg-emerald-500/8 border border-emerald-500/20 text-emerald-400 text-[0.72rem] px-3 py-1.5 rounded-full mt-2 w-fit font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              <span className="status-dot w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              Active Session
            </div>
          </div>

          <div
            className="w-[80px] h-[80px] bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center font-display text-[1.6rem] font-extrabold text-[#0a0a0a] flex-shrink-0"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            {userLoading ? "·" : getInitials(user?.name ?? "Guest User")}
          </div>
        </div>

        <div className="font-mono text-[0.68rem] uppercase tracking-[0.12em] text-[#6b6b6b] mb-4 animate-fade-in-up" style={{ animationDelay: "140ms", fontFamily: "'JetBrains Mono', monospace" }}>
          Game Overview
        </div>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {metrics.map((m) => (
            <MetricCard key={m.label} {...m} />
          ))}
        </div>

        <div
          className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-5 animate-fade-in-up"
          style={{ animationDelay: "560ms", animationFillMode: "both" }}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="font-display text-[0.95rem] font-bold tracking-[-0.01em]" style={{ fontFamily: "'Syne', sans-serif" }}>
              Game Sessions
            </div>
            <div className="font-mono text-[0.65rem] text-[#6b6b6b] bg-[#1c1c1c] border border-[#1f1f1f] px-2 py-0.5 rounded" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {gameData.length} total
            </div>
          </div>

          {gameLoading ? (
            <div className="flex items-center gap-2 text-[#6b6b6b] text-sm py-6 justify-center">
              <span className="spin w-4 h-4 rounded-full border-2 border-[#2a2a2a] border-t-amber-400 inline-block" />
              Loading sessions…
            </div>
          ) : gameData.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-[#6b6b6b] text-[0.82rem]">No game sessions yet.</div>
              <div className="font-mono text-[0.7rem] text-[#3a3a3a] mt-1">Start your first game to see data here.</div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {gameData.map((session, i) => (
                <SessionRow key={session._id} session={session} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Profile;
