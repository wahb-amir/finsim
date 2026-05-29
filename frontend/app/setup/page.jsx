"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";

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

  const {
    playerName,
    setPlayerName,
    confidence,
    setConfidence,
    goal,
    setGoal,
    startSimulation,
  } = useGame();

  const [step, setStep] = useState(1);
  const [loadingUser, setLoadingUser] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const API = process.env.NEXT_PUBLIC_API_URL;

  const showToast = (type, message) => {
    setToast({ type, message });

    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  useEffect(() => {
    const getUser = async () => {
      try {
        const res = await fetch(`${API}/auth/me`, {
          method: "GET",
          credentials: "include",
        });

        const data = await res.json();

        if (data.success && data.user) {
          setPlayerName(data.user.name);

          setTimeout(() => {
            setStep(2);
          }, 700);
        } else {
          router.push("/auth");
        }
      } catch (err) {
        router.push("/auth");
      } finally {
        setLoadingUser(false);
      }
    };

    getUser();
  }, [API, router, setPlayerName]);

  const canProceedStep1 = playerName.trim().length >= 2;
  const canProceedStep2 = confidence >= 1;
  const canProceedStep3 = goal !== "";

  const handleBegin = async () => {
    if (!canProceedStep3) return;

    setSubmitting(true);

    try {
      const res = await fetch(`${API}/setup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: playerName,
          confidence,
          goal,
        }),
      });

      const data = await res.json();

      if (data.success) {
        showToast("success", data.message);

        const scenarioByGoal = {
          "avoid-debt": "recession",
          "build-wealth": confidence >= 4 ? "startup-founder" : "baseline",
          "understand-basics": "single-parent",
        };

        const scenarioId = scenarioByGoal[goal] || "baseline";

        const seed = Date.now();

        startSimulation(scenarioId, seed);

        setTimeout(() => {
          router.push("/game");
        }, 1200);
      } else {
        showToast("error", data.message || "Failed");
      }
    } catch (err) {
      showToast("error", "Server Error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-[#F59E0B]">
        Loading...
      </div>
    );
  }

  return (
    <>
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl text-sm font-medium backdrop-blur-xl border transition-all duration-300 shadow-[0_0_30px_rgba(0,0,0,0.35)] ${
            toast.type === "success"
              ? "bg-[#0F172A]/90 border-[#10B981]/30 text-[#10B981]"
              : "bg-[#0F172A]/90 border-red-500/30 text-red-400"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-4 relative overflow-hidden">
        <div
          className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-[0.06] pointer-events-none"
          style={{
            background: "radial-gradient(ellipse, #F59E0B, transparent 70%)",
          }}
        />

        <div className="w-full max-w-lg relative z-10">
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
                      <path
                        d="M2 5L4.5 7.5L8 3"
                        stroke="#10B981"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    s
                  )}
                </div>

                {s < 3 && (
                  <div
                    className="w-12 h-px"
                    style={{
                      background:
                        s < step ? "rgba(16,185,129,0.3)" : "#1F1F1F",
                    }}
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

          {step === 1 && (
            <div className="animate-fade-in-up">
              <h2
                className="text-3xl font-bold text-center mb-2 text-[#F5F5F5]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                What&apos;s your name?
              </h2>

              <p className="text-[#6B6B6B] text-center text-sm mb-8">
                We&apos;ll track your decisions and results throughout the
                simulation.
              </p>

              <div className="rounded-xl bg-[#111111] border border-[#242424] p-6">
                <label className="block text-[11px] text-[#6B6B6B] uppercase tracking-widest mb-3 font-medium">
                  Your name
                </label>

                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full bg-[#0D0D0D] text-white border border-[#2A2A2A] rounded-lg px-4 py-3 text-base placeholder-[#3A3A3A] focus:outline-none focus:border-[#F59E0B]/60 transition-colors"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in-up">
              <h2
                className="text-3xl font-bold text-center mb-2 text-[#F5F5F5]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                How confident are you with money?
              </h2>

              <p className="text-[#6B6B6B] text-center text-sm mb-8">
                No judgment here — this is just for flavor.
              </p>

              <div className="rounded-xl bg-[#111111] border border-[#242424] p-6">
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={confidence}
                  onChange={(e) => setConfidence(Number(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #F59E0B ${
                      ((confidence - 1) / 4) * 100
                    }%, #2A2A2A ${((confidence - 1) / 4) * 100}%)`,
                  }}
                />

                <div className="text-center mt-4">
                  <span className="text-[#F59E0B] text-2xl font-bold">
                    {confidence}
                  </span>

                  <span className="text-[#A1A1A1] text-sm ml-2">
                    — {CONFIDENCE_LABELS[confidence]}
                  </span>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in-up">
              <h2
                className="text-3xl font-bold text-center mb-2 text-[#F5F5F5]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                What&apos;s your goal?
              </h2>

              <div className="space-y-3 mt-8">
                {GOALS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setGoal(g.id)}
                    className={`w-full text-left rounded-xl p-5 border transition-all duration-200 flex items-center gap-4 ${
                      goal === g.id
                        ? "border-[#F59E0B] bg-[#111111]"
                        : "border-[#242424] bg-[#111111]"
                    }`}
                  >
                    <span className="text-2xl">{g.icon}</span>

                    <div>
                      <div className="font-semibold text-white">
                        {g.title}
                      </div>

                      <div className="text-[12px] text-[#6B6B6B]">
                        {g.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex-1 px-6 py-3.5 rounded-xl border border-[#2A2A2A] text-[#A1A1A1]"
              >
                Back
              </button>
            )}

            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
                className="flex-1 px-6 py-3.5 rounded-xl font-semibold text-sm bg-[#F59E0B] text-black disabled:opacity-40"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleBegin}
                disabled={!canProceedStep3 || submitting}
                className="flex-1 px-6 py-3.5 rounded-xl font-semibold text-sm bg-[#F59E0B] text-black disabled:opacity-40"
              >
                {submitting ? "Creating..." : "Begin my life →"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function SetupPage() {
  return <SetupContent />;
}