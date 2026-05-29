"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";

// Premium Icon Components
const ShieldIcon = () => (
  <svg className="w-5 h-5 text-[#F59E0B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

const TrendUpIcon = () => (
  <svg className="w-5 h-5 text-[#F59E0B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 005.814-5.519l2.74-1.22m0 0l-5.94-2.281m5.94 2.28l-2.28 5.941" />
  </svg>
);

const CompassIcon = () => (
  <svg className="w-5 h-5 text-[#F59E0B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 7.5l-2.25 2.25zm0 0l2.25 2.25-2.25-2.25zm0 0l-5.25 5.25 3-3-3 3zm0 0l-3-3 3 3z" />
  </svg>
);

const SparklesIcon = () => (
  <svg className="w-5 h-5 text-[#F59E0B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l-.813-5.096L3 15l5.096-.813L9 9l.813 5.096L15 15l-5.096.813zM18.25 5.25L17.5 8l-.75-2.75L14 4.5l2.75-.75L17.5 1l.75 2.75L21 4.5l-2.75.75z" />
  </svg>
);

const WalletIcon = () => (
  <svg className="w-5 h-5 text-[#F59E0B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6A2.25 2.25 0 0118.75 20H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
  </svg>
);

const ScaleIcon = () => (
  <svg className="w-5 h-5 text-[#F59E0B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m-9-4h18M4 7h16m-2 0v4a6 6 0 01-12 0V7" />
  </svg>
);

const ARCHETYPES = [
  {
    id: "variable-income",
    title: "The Dynamic Earner",
    description: "Freelancer, founder, or gig worker dealing with fluctuating monthly cash flow.",
    icon: <SparklesIcon />,
  },
  {
    id: "lifestyle-creep",
    title: "The High-Spend Professional",
    description: "Making decent money, but fixed costs and lifestyle upgrades absorb most of it.",
    icon: <ScaleIcon />,
  },
  {
    id: "paycheck-to-paycheck",
    title: "The Lean Optimizer",
    description: "Tight margins where an unexpected bill or emergency can derail progress easily.",
    icon: <WalletIcon />,
  },
];

const GOALS = [
  {
    id: "avoid-debt",
    title: "Avoid Debt Trap",
    description: "Learn to identify hidden balance risks and insulate your baseline income.",
    icon: <ShieldIcon />,
  },
  {
    id: "build-wealth",
    title: "Accelerate Net Worth",
    description: "Optimize asset allocation, calculate risk vectors, and scale long-term capital.",
    icon: <TrendUpIcon />,
  },
  {
    id: "understand-basics",
    title: "Master Financial Literacy",
    description: "Demystify macroeconomic baselines, complex interest systems, and real tax implications.",
    icon: <CompassIcon />,
  },
];

const CONFIDENCE_LABELS = {
  1: "Anxious / Avoidant",
  2: "Cautious Observer",
  3: "Baseline Standard",
  4: "Tactical Thinker",
  5: "Market Confident",
};

function SetupContent() {
  const router = useRouter();
  
  const { 
    playerName: archetype, 
    setPlayerName: setArchetype, 
    confidence, 
    setConfidence, 
    goal, 
    setGoal, 
    startSimulation 
  } = useGame();
  const [step, setStep] = useState(1);

  const canProceedStep1 = archetype && archetype !== "";
  const canProceedStep2 = confidence >= 1;
  const canProceedStep3 = goal !== "";

  const handleBegin = () => {
    if (!canProceedStep3) return;
    
    const scenarioByGoal = {
      "avoid-debt": "recession",
      "build-wealth": confidence >= 4 ? "startup-founder" : "baseline",
      "understand-basics": "single-parent",
    };
    
    const scenarioId = scenarioByGoal[goal] || "baseline";
    const seed = Date.now();
    
    startSimulation(scenarioId, seed);
    router.push("/game");
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* BG ambient glow */}
      <div
        className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-[0.05] pointer-events-none"
        style={{ background: "radial-gradient(ellipse, #F59E0B, transparent 70%)" }}
      />

      <div className="w-full max-w-lg relative z-10">
        {/* Step Indicator Tracking */}
        <div className="flex items-center justify-center gap-3 mb-10">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-3">
              <div
                className={`flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold transition-all duration-300 ${
                  s === step
                    ? "bg-[#F59E0B] text-black scale-110"
                    : s < step
                    ? "bg-[#1A1A1A] border border-[#10B981]/40 text-[#10B981]"
                    : "bg-[#1A1A1A] border border-[#2A2A2A] text-[#4A4A4A]"
                }`}
              >
                {s < step ? (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5L4.5 7.5L8 3" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  s
                )}
              </div>
              {s < 3 && (
                <div
                  className="w-12 h-px"
                  style={{ background: s < step ? "rgba(16,185,129,0.3)" : "#1F1F1F" }}
                />
              )}
            </div>
          ))}
        </div>

        <div className="text-center mb-2">
          <p className="text-[11px] text-[#6B6B6B] tracking-widest uppercase">
            Configuration Step {step} of 3
          </p>
        </div>

        {/* Step 1: High-Signal AI Profiling Question */}
        {step === 1 && (
          <div className="animate-fade-in-up">
            <h2 className="text-3xl font-bold text-center mb-2 text-[#F5F5F5] tracking-tight">
              What baseline dynamic defines your current cash flow?
            </h2>
            <p className="text-[#6B6B6B] text-center text-sm mb-8">
              This feeds our engine to model scenarios native to your realistic real-world vulnerabilities.
            </p>
            
            <div className="space-y-3">
              {ARCHETYPES.map((arch) => (
                <button
                  key={arch.id}
                  onClick={() => setArchetype(arch.id)}
                  className={`
                    w-full text-left rounded-xl p-5 border transition-all duration-200 flex items-start gap-4
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]
                    ${
                      archetype === arch.id
                        ? "border-[#F59E0B] bg-[#111111] shadow-[0_0_20px_rgba(245,158,11,0.06)]"
                        : "border-[#242424] bg-[#111111] hover:border-[#F59E0B]/30"
                    }
                  `}
                  aria-pressed={archetype === arch.id}
                >
                  <div className="p-2 rounded-lg bg-[#1A1A1A] border border-[#2D2D2D] flex-shrink-0">
                    {arch.icon}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div
                      className="font-semibold text-sm mb-0.5"
                      style={{ color: archetype === arch.id ? "#F5F5F5" : "#D1D1D1" }}
                    >
                      {arch.title}
                    </div>
                    <div className="text-[12px] text-[#6B6B6B] leading-relaxed">{arch.description}</div>
                  </div>
                  {archetype === arch.id && (
                    <div className="w-5 h-5 rounded-full bg-[#F59E0B] flex-shrink-0 flex items-center justify-center self-center">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5L4.5 7.5L8 3" stroke="#0A0A0A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Behavioral Confidence Slider */}
        {step === 2 && (
          <div className="animate-fade-in-up">
            <h2 className="text-3xl font-bold text-center mb-2 text-[#F5F5F5] tracking-tight">
              Rate your structural financial confidence
            </h2>
            <p className="text-[#6B6B6B] text-center text-sm mb-8">
              Determines the starting complexity vectors and stress-test intensity.
            </p>
            <div className="rounded-xl bg-[#111111] border border-[#242424] p-6">
              <div className="flex justify-between text-[11px] text-[#6B6B6B] uppercase tracking-wider mb-6">
                <span>Risk Averse</span>
                <span>Calculated Trader</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={confidence}
                onChange={(e) => setConfidence(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer mb-4"
                style={{
                  background: `linear-gradient(to right, #F59E0B ${(confidence - 1) * 25}%, #2A2A2A ${(confidence - 1) * 25}%)`,
                  accentColor: "#F59E0B",
                }}
                aria-label="Confidence profile selection"
                aria-valuemin={1}
                aria-valuemax={5}
                aria-valuenow={confidence}
                aria-valuetext={CONFIDENCE_LABELS[confidence]}
              />
              <div className="text-center mt-2">
                <span className="text-2xl font-bold text-[#F59E0B] tracking-tight">
                  Level {confidence}
                </span>
                <span className="text-[#A1A1A1] text-sm ml-2.5">— {CONFIDENCE_LABELS[confidence]}</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: High-End Goal Identification */}
        {step === 3 && (
          <div className="animate-fade-in-up">
            <h2 className="text-3xl font-bold text-center mb-2 text-[#F5F5F5] tracking-tight">
              What is your primary simulation vector?
            </h2>
            <p className="text-[#6B6B6B] text-center text-sm mb-8">
              The algorithm evaluates success weights based entirely on this selection.
            </p>
            
            <div className="space-y-3">
              {GOALS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setGoal(g.id)}
                  className={`
                    w-full text-left rounded-xl p-5 border transition-all duration-200 flex items-start gap-4
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]
                    ${
                      goal === g.id
                        ? "border-[#F59E0B] bg-[#111111] shadow-[0_0_20px_rgba(245,158,11,0.06)]"
                        : "border-[#242424] bg-[#111111] hover:border-[#F59E0B]/30"
                    }
                  `}
                  aria-pressed={goal === g.id}
                >
                  <div className="p-2 rounded-lg bg-[#1A1A1A] border border-[#2D2D2D] flex-shrink-0">
                    {g.icon}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div
                      className="font-semibold text-sm mb-0.5"
                      style={{ color: goal === g.id ? "#F5F5F5" : "#D1D1D1" }}
                    >
                      {g.title}
                    </div>
                    <div className="text-[12px] text-[#6B6B6B] leading-relaxed">{g.description}</div>
                  </div>
                  {goal === g.id && (
                    <div className="w-5 h-5 rounded-full bg-[#F59E0B] flex-shrink-0 flex items-center justify-center self-center">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5L4.5 7.5L8 3" stroke="#0A0A0A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Global Control Layout */}
        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 px-6 py-3.5 rounded-xl border border-[#2A2A2A] text-[#A1A1A1] text-sm font-medium hover:border-[#3A3A3A] hover:text-[#F5F5F5] transition-all"
            >
              Back
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
              className="flex-1 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed bg-[#F59E0B] text-[#0A0A0A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleBegin}
              disabled={!canProceedStep3}
              className="flex-1 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed bg-[#F59E0B] text-[#0A0A0A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
              style={{
                boxShadow: canProceedStep3 ? "0 0 30px rgba(245,158,11,0.15)" : "none",
              }}
            >
              Initialize Simulation →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SetupPage() {
  return <SetupContent />;
}