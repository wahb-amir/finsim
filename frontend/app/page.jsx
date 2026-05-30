"use client";
import { useState } from "react";
import Modal from "../components/ui/Modal";
import { Nav, Footer, Ticker } from "../components/layout/HeaderFooter";
import { HeroSection, StatsSection, MythBusterSection, HowItWorksSection, FinalCTA } from "../components/sections/CoreSections";
import { CompoundCalculator, DecisionSimulator } from "../components/features/InteractiveTools";

export default function LandingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Replaces the old alert() with our shiny new Modal
  const handleStart = () => setIsModalOpen(true);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#08090A",
        fontFamily: "'Inter Variable', 'Inter', -apple-system, system-ui, sans-serif",
        fontFeatureSettings: '"cv01", "ss03"',
        color: "#F7F8F8",
        overflowX: "hidden",
      }}
    >
      {/* Background grid */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(245,158,11,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        <Nav onStart={handleStart} />
        <Ticker />
        <HeroSection onStart={handleStart} />
        <StatsSection />
        <CompoundCalculator />
        <DecisionSimulator />
        <MythBusterSection />
        <HowItWorksSection />
        <FinalCTA onStart={handleStart} />
        <Footer />
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Simulation Starting"
        message="You are about to enter the full 10-year financial simulator. You will be redirected to connect your account."
      />
    </div>
  );
}