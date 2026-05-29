"use client";

import { useRouter } from "next/navigation";
import { StatCard } from "@/components/ui/StatCard";

function LandingContent() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col overflow-hidden">
      {/* Background grid pattern */}
      <div
        className="fixed inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#F5F5F5 1px, transparent 1px), linear-gradient(90deg, #F5F5F5 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Radial glow */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-10 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center top, #F59E0B, transparent 70%)",
        }}
      />

      {/* Hero — full viewport height */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 min-h-screen relative">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[11px] font-medium mb-8 animate-fade-in-up"
          style={{
            background: "rgba(245,158,11,0.05)",
            borderColor: "rgba(245,158,11,0.2)",
            color: "#F59E0B",
          }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-green-pulse" />
          <span>HACKATHON PROJECT · FINANCIAL LITERACY SIMULATOR</span>
        </div>

        {/* Headline */}
        <h1
          className="text-5xl md:text-7xl font-extrabold tracking-tight leading-none mb-6 animate-fade-in-up"
          style={{
            fontFamily: "var(--font-display)",
            animationDelay: "0.1s",
            animationFillMode: "both",
          }}
        >
          Live{" "}
          <span className="text-gradient-amber">10 years</span>
          <br />
          of financial decisions
          <br />
          in{" "}
          <span
            className="relative inline-block"
            style={{ color: "#F5F5F5" }}
          >
            15 minutes.
            <div
              className="absolute -bottom-1 left-0 right-0 h-[2px] rounded-full"
              style={{ background: "linear-gradient(90deg, #F59E0B, transparent)" }}
            />
          </span>
        </h1>

        {/* Subtext */}
        <p
          className="text-[#A1A1A1] text-lg md:text-xl max-w-xl leading-relaxed mb-10 animate-fade-in-up"
          style={{ animationDelay: "0.2s", animationFillMode: "both" }}
        >
          80% of teens enter adulthood without understanding credit scores, compound interest, or
          how a single decision compounds over decades. We fix that.
        </p>

        {/* CTA */}
        <button
          onClick={() => router.push("/setup")}
          className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-base transition-all duration-200 animate-fade-in-up focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
          style={{
            background: "#F59E0B",
            color: "#0A0A0A",
            animationDelay: "0.3s",
            animationFillMode: "both",
            boxShadow: "0 0 40px rgba(245,158,11,0.2)",
            fontFamily: "var(--font-display)",
          }}
          aria-label="Start the financial simulation"
        >
          Start Simulation
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="group-hover:translate-x-1 transition-transform duration-200"
          >
            <path
              d="M3 8H13M13 8L9 4M13 8L9 12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
          <span className="text-[10px] tracking-widest text-[#6B6B6B] uppercase">The problem</span>
          <svg width="12" height="16" viewBox="0 0 12 16" fill="none" className="animate-bounce">
            <path d="M6 1V15M6 15L1 10M6 15L11 10" stroke="#6B6B6B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </section>

      {/* Stats section */}
      <section className="px-6 pb-24 max-w-5xl mx-auto w-full">
        <div className="text-center mb-10">
          <h2
            className="text-xl font-bold text-[#F5F5F5] mb-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            The scale of financial illiteracy
          </h2>
          <p className="text-[#6B6B6B] text-sm">Real numbers. Real consequences.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            number="43%"
            label="Think 18% APR is manageable"
            sublabel="It means paying $2,500 on a $5k balance over 3 years"
            color="#EF4444"
          />
          <StatCard
            number="78%"
            label="Teens lack basic credit knowledge"
            sublabel="By graduation, many have already made irreversible mistakes"
            color="#F59E0B"
          />
          <StatCard
            number="$1.7T"
            label="US student loan debt"
            sublabel="Most borrowers didn't understand compound interest when they signed"
            color="#10B981"
          />
        </div>

        {/* Footer line */}
        <div className="mt-16 pt-8 border-t border-[#1F1F1F] flex items-center justify-between text-[11px] text-[#4A4A4A]">
          <span>FinSim · Built for the Hackathon</span>
          <span>No data stored · No account required</span>
        </div>
      </section>
    </div>
  );
}

export default function LandingPage() {
  return <LandingContent />;
}
