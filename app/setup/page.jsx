"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GameProvider, useGame } from "@/context/GameContext";

const GOALS = [
  {
    id: "avoid-debt",
    title: "Avoid Debt",
    description: "Learn to stay out of the debt trap and protect your income",
    icon: "🛡️",
  },
  {
    id: "build-wealth",
    title: "Build Wealth",
    description: "Grow assets, invest smart, and build long-term net worth",
    icon: "📈",
  },
  {
    id: "understand-basics",
    title: "Understand the Basics",
    description: "Get fluent in credit, budgeting, and how money works",
    icon: "💡",
  },
];

const CONFIDENCE_LABELS = {
  1: "Not at all",
  2: "A little",
  3: "Somewhat",
  4: "Pretty confident",
  5: "Very confident",
};

function SetupContent() {
  const router = useRouter();
  const { playerName, setPlayerName, confidence, setConfidence, goal, setGoal } = useGame();
  const [step, setStep] = useState(1);

  const canProceedStep1 = playerName.trim().length >= 2;
  const canProceedStep2 = confidence >= 1;
  const canProceedStep3 = goal !== "";

  const handleBegin = () => {
    if (!canProceedStep3) return;
    router.push("/game");
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* BG glow */}
      <div
        className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-[0.06] pointer-events-none"
        style={{ background: "radial-gradient(ellipse, #F59E0B, transparent 70%)" }}
      />

      <div className="w-full max-w-lg relative z-10">
        {/* Step dots */}
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
            Step {step} of 3
          </p>
        </div>

        {/* Step 1: Name */}
        {step === 1 && (
          <div className="animate-fade-in-up">
            <h2
              className="text-3xl font-bold text-center mb-2 text-[#F5F5F5]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              What&apos;s your name?
            </h2>
            <p className="text-[#6B6B6B] text-center text-sm mb-8">
              We&apos;ll track your decisions and results throughout the simulation.
            </p>
            <div className="rounded-xl bg-[#111111] border border-[#242424] p-6">
              <label htmlFor="player-name" className="block text-[11px] text-[#6B6B6B] uppercase tracking-widest mb-3 font-medium">
                Your name
              </label>
              <input
                id="player-name"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && canProceedStep1 && setStep(2)}
                placeholder="Enter your name..."
                autoFocus
                className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-4 py-3 text-base text-[#F5F5F5] placeholder-[#3A3A3A] focus:outline-none focus:border-[#F59E0B]/60 transition-colors"
                aria-describedby="name-hint"
              />
              <p id="name-hint" className="text-[11px] text-[#4A4A4A] mt-2">
                Used to personalize your simulation experience
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Confidence slider */}
        {step === 2 && (
          <div className="animate-fade-in-up">
            <h2
              className="text-3xl font-bold text-center mb-2 text-[#F5F5F5]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              How confident are you with money?
            </h2>
            <p className="text-[#6B6B6B] text-center text-sm mb-8">
              No judgment here — this is just for flavor. Your choices determine everything.
            </p>
            <div className="rounded-xl bg-[#111111] border border-[#242424] p-6">
              <div className="flex justify-between text-[11px] text-[#6B6B6B] mb-6">
                <span>Not at all</span>
                <span>Very confident</span>
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
                aria-label="Confidence level"
                aria-valuemin={1}
                aria-valuemax={5}
                aria-valuenow={confidence}
                aria-valuetext={CONFIDENCE_LABELS[confidence]}
              />
              <div className="text-center">
                <span
                  className="text-2xl font-bold"
                  style={{ fontFamily: "var(--font-display)", color: "#F59E0B" }}
                >
                  {confidence}
                </span>
                <span className="text-[#A1A1A1] text-sm ml-2">— {CONFIDENCE_LABELS[confidence]}</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Goal cards */}
        {step === 3 && (
          <div className="animate-fade-in-up">
            <h2
              className="text-3xl font-bold text-center mb-2 text-[#F5F5F5]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              What&apos;s your goal?
            </h2>
            <p className="text-[#6B6B6B] text-center text-sm mb-8">
              We&apos;ll show how well your decisions align with your stated intent.
            </p>
            <div className="space-y-3">
              {GOALS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setGoal(g.id)}
                  className={`
                    w-full text-left rounded-xl p-5 border transition-all duration-200 flex items-center gap-4
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]
                    ${
                      goal === g.id
                        ? "border-[#F59E0B] bg-[#111111] shadow-[0_0_20px_rgba(245,158,11,0.08)]"
                        : "border-[#242424] bg-[#111111] hover:border-[#F59E0B]/30"
                    }
                  `}
                  aria-pressed={goal === g.id}
                >
                  <span className="text-2xl flex-shrink-0">{g.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div
                      className="font-semibold text-sm mb-0.5"
                      style={{
                        color: goal === g.id ? "#F5F5F5" : "#D1D1D1",
                        fontFamily: "var(--font-display)",
                      }}
                    >
                      {g.title}
                    </div>
                    <div className="text-[12px] text-[#6B6B6B]">{g.description}</div>
                  </div>
                  {goal === g.id && (
                    <div className="w-5 h-5 rounded-full bg-[#F59E0B] flex-shrink-0 flex items-center justify-center">
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

        {/* Navigation buttons */}
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
              className="flex-1 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
              style={{
                background: "#F59E0B",
                color: "#0A0A0A",
                fontFamily: "var(--font-display)",
              }}
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleBegin}
              disabled={!canProceedStep3}
              className="flex-1 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
              style={{
                background: "#F59E0B",
                color: "#0A0A0A",
                fontFamily: "var(--font-display)",
                boxShadow: canProceedStep3 ? "0 0 30px rgba(245,158,11,0.2)" : "none",
              }}
            >
              Begin my life →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SetupPage() {
  return (
    <GameProvider>
      <SetupContent />
    </GameProvider>
  );
}
