"use client";

import { useEffect, useState } from "react";

const getInitials = (name) => {
  if (!name) return "--";
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0].toUpperCase())
    .join("");
};

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

const BarRow = ({ name, value, pct, colorClass }) => (
  <div>
    <div className="flex justify-between items-baseline mb-1.5">
      <span className="text-[0.78rem] text-[#a1a1a1]">{name}</span>
      <span className="font-mono text-[0.72rem] text-[#6b6b6b]">{value}</span>
    </div>
    <div className="h-1 bg-[#1c1c1c] rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full ${colorClass}`}
        style={{ width: pct, animation: "barGrow 0.8s ease-out 0.5s both" }}
      />
    </div>
  </div>
);

const TxnRow = ({ name, date, amount, type }) => (
  <div className="flex items-center gap-3 px-3 py-2.5 bg-[#161616] border border-[#242424] rounded-lg hover:border-[#1f1f1f] transition-colors duration-200">
    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${type === "income" ? "bg-emerald-400" : "bg-red-400"}`} />
    <div className="flex-1 min-w-0">
      <div className="text-[0.8rem] text-[#f5f5f5] truncate">{name}</div>
      <div className="font-mono text-[0.68rem] text-[#6b6b6b] mt-0.5">{date}</div>
    </div>
    <span className={`font-mono text-[0.82rem] ${type === "income" ? "text-emerald-400" : "text-red-400"}`}>
      {amount}
    </span>
  </div>
);

const Profile = () => {
  const API = process.env.NEXT_PUBLIC_API_URL;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetch(`${API}/auth/me`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setUser(d.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
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

  const metrics = [
    { label: "Total Revenue", value: "$84,200", variant: "amber", badge: "↑ 12.4%", badgeType: "up", sub: "vs last month", icon: "◈", delay: 300 },
    { label: "Total Debt", value: "$23,500", variant: "red", badge: "↑ 3.1%", badgeType: "down", sub: "outstanding", icon: "◫", delay: 360 },
    { label: "Net Balance", value: "$60,700", variant: "green", badge: "↑ 8.9%", badgeType: "up", sub: "net gain", icon: "◉", delay: 420 },
    { label: "Expenses", value: "$19,340", variant: "amber", badge: "↑ 2.2%", badgeType: "down", sub: "this month", icon: "▤", delay: 480 },
    { label: "Investments", value: "$41,800", variant: "blue", badge: "↑ 5.7%", badgeType: "up", sub: "portfolio", icon: "◧", delay: 540 },
    { label: "Savings", value: "$12,560", variant: "green", badge: "→ 0.4%", badgeType: "neutral", sub: "rate", icon: "◌", delay: 600 },
  ];

  const bars = [
    { name: "Product Sales", value: "$38,400", pct: "91%", colorClass: "bg-gradient-to-r from-amber-600 to-amber-400" },
    { name: "Services", value: "$21,300", pct: "54%", colorClass: "bg-gradient-to-r from-emerald-600 to-emerald-400" },
    { name: "Subscriptions", value: "$14,900", pct: "38%", colorClass: "bg-gradient-to-r from-blue-600 to-blue-400" },
    { name: "Affiliate", value: "$9,600", pct: "23%", colorClass: "bg-gradient-to-r from-amber-600 to-amber-400" },
  ];

  const txns = [
    { name: "Client Payment — Acme Co.", date: "May 28, 2026", amount: "+$12,400", type: "income" },
    { name: "AWS Infrastructure", date: "May 26, 2026", amount: "−$3,200", type: "expense" },
    { name: "SaaS Subscription Revenue", date: "May 24, 2026", amount: "+$5,800", type: "income" },
    { name: "Loan Repayment", date: "May 22, 2026", amount: "−$1,500", type: "expense" },
    { name: "Consulting — Q2 Retainer", date: "May 20, 2026", amount: "+$8,000", type: "income" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500&family=JetBrains+Mono:wght@300;400&display=swap');
        .font-display { font-family: 'Syne', system-ui, sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        @keyframes barGrow { from { width: 0 } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(18px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes greenPulse { 0%,100%{ opacity:1;transform:scale(1) } 50%{ opacity:.5;transform:scale(.85) } }
        @keyframes spin { to { transform: rotate(360deg) } }
        .animate-fade-in-up { animation: fadeInUp 0.55s ease-out both; }
        .status-dot { animation: greenPulse 2s ease-in-out infinite; }
        .spin { animation: spin 0.9s linear infinite; }
      `}</style>

      <div className="max-w-[1100px] mx-auto px-6 py-10 font-body" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <div className="flex items-center justify-between mb-12 animate-fade-in-up">
          <div className="font-display text-lg font-bold tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
            fin<span className="text-amber-400">.</span>arc
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-2 bg-[#111111] border border-[#1f1f1f] text-[#a1a1a1] text-[0.8rem] px-4 py-2 rounded-md cursor-pointer transition-all duration-250 hover:border-red-500/60 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-40"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {loggingOut ? "Signing out…" : "Sign Out"}
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

            {loading ? (
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
            {loading ? "·" : getInitials(user?.name ?? "Guest User")}
          </div>
        </div>

        <div className="font-mono text-[0.68rem] uppercase tracking-[0.12em] text-[#6b6b6b] mb-4 animate-fade-in-up" style={{ animationDelay: "140ms", fontFamily: "'JetBrains Mono', monospace" }}>
          Financial Overview
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4" style={{ animation: "none" }}>
          {metrics.map((m) => (
            <MetricCard key={m.label} {...m} />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-1" style={{ animationDelay: "500ms" }}>
          <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-5 animate-fade-in-up" style={{ animationDelay: "560ms", animationFillMode: "both" }}>
            <div className="flex items-center justify-between mb-5">
              <div className="font-display text-[0.95rem] font-bold tracking-[-0.01em]" style={{ fontFamily: "'Syne', sans-serif" }}>Revenue Breakdown</div>
              <div className="font-mono text-[0.65rem] text-[#6b6b6b] bg-[#1c1c1c] border border-[#1f1f1f] px-2 py-0.5 rounded" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Monthly</div>
            </div>
            <div className="flex flex-col gap-4">
              {bars.map((b) => (
                <BarRow key={b.name} {...b} />
              ))}
            </div>
          </div>

          <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-5 animate-fade-in-up" style={{ animationDelay: "620ms", animationFillMode: "both" }}>
            <div className="flex items-center justify-between mb-5">
              <div className="font-display text-[0.95rem] font-bold tracking-[-0.01em]" style={{ fontFamily: "'Syne', sans-serif" }}>Recent Transactions</div>
              <div className="font-mono text-[0.65rem] text-[#6b6b6b] bg-[#1c1c1c] border border-[#1f1f1f] px-2 py-0.5 rounded" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Last 30d</div>
            </div>
            <div className="flex flex-col gap-2">
              {txns.map((t) => (
                <TxnRow key={t.name} {...t} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
