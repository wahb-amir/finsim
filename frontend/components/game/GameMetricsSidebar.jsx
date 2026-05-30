import { useRouter } from "next/navigation";
import { MetricCard } from "@/components/ui/MetricCard";
import { CreditBadge } from "@/components/game/CreditBadge";
import { formatCurrency, prettifyLabel } from "@/lib/format";
import { TOTAL_ROUNDS } from "@/components/game/constants";

export function GameMetricsSidebar({
  open,
  userName,
  roundData,
  currentRound,
  session,
  metrics,
  exiting,
  onExitGame,
  onClose,
}) {
  const router = useRouter();

  return (
    <>
      <aside
        className={`
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
          fixed md:relative top-12 md:top-auto left-0 md:left-auto
          h-[calc(100vh-3rem)] md:h-auto
          w-72 md:w-72 flex-shrink-0
          bg-[#0A0A0A] md:bg-transparent border-r border-[#1A1A1A]
          overflow-y-auto
          flex flex-col
          z-20 transition-transform duration-300
          p-3 gap-2
        `}
      >
        <div className="rounded-2xl bg-[#111111] border border-[#1F1F1F] p-4 mb-1">
          <div
            className="text-sm font-bold text-[#F5F5F5] truncate"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {userName}
          </div>

          <div className="mt-2 text-[11px] text-[#6B6B6B] space-y-1">
            <div>
              {roundData.year} · Round {currentRound} of {TOTAL_ROUNDS}
            </div>
            <div>Career: {prettifyLabel(session.career)}</div>
            <div>Climate: {prettifyLabel(session.climateLabel)}</div>
            <div>Goal: {prettifyLabel(session.goal)}</div>
            <div>Starting salary: {formatCurrency(session.startSalary)}</div>
          </div>

          <div className="mt-3 flex flex-col gap-2">
            <button
              type="button"
              className="text-[13px] bg-[#F59E0B] hover:bg-[#ffb11f] text-black px-4 py-2 font-semibold rounded-[10px] transition-colors"
              onClick={() => router.push("/profile")}
            >
              Visit Profile
            </button>
            <button
              type="button"
              disabled={exiting}
              onClick={onExitGame}
              className="text-[12px] px-4 py-2 font-medium rounded-[10px] border border-[#2A2A2A] text-[#A1A1A1] hover:border-[#3A3A3A] hover:text-[#F5F5F5] transition-colors disabled:opacity-50"
            >
              {exiting ? "Saving & exiting…" : "Exit Game"}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <MetricCard
            label="Monthly Income"
            value={formatCurrency(metrics.monthlyIncome)}
            compact
          />
          <MetricCard
            label="Monthly Expenses"
            value={formatCurrency(metrics.monthlyExpenses)}
            compact
          />
          <MetricCard
            label="Savings Balance"
            value={formatCurrency(metrics.savingsBalance)}
            colorCode={
              metrics.savingsBalance > 5000
                ? "#10B981"
                : metrics.savingsBalance > 1000
                  ? "#F59E0B"
                  : "#EF4444"
            }
            compact
          />
          <MetricCard
            label="Total Debt"
            value={formatCurrency(metrics.totalDebt)}
            colorCode={
              metrics.totalDebt === 0
                ? "#10B981"
                : metrics.totalDebt < 10000
                  ? "#F59E0B"
                  : "#EF4444"
            }
            compact
          />

          <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#111111] border border-[#1F1F1F]">
            <span className="text-[11px] text-[#6B6B6B] uppercase tracking-wider font-medium">
              Credit Score
            </span>
            <CreditBadge score={metrics.creditScore} />
          </div>

          <MetricCard
            label="Retirement"
            value={formatCurrency(metrics.retirementBalance)}
            colorCode={metrics.retirementBalance > 5000 ? "#10B981" : "#A1A1A1"}
            compact
          />
          <MetricCard
            label="Debt-to-Income"
            value={`${Math.round(metrics.debtToIncome)}%`}
            colorCode={
              metrics.debtToIncome < 20
                ? "#10B981"
                : metrics.debtToIncome < 40
                  ? "#F59E0B"
                  : "#EF4444"
            }
            compact
          />
          <MetricCard
            label="Stress Index"
            value={metrics.stressIndex}
            isProgress
            compact
          />
        </div>
      </aside>

      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-10 top-12"
          onClick={onClose}
        />
      )}
    </>
  );
}
