"use client";
import { useState, useEffect } from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { tickerFacts } from "../../lib/data";

export function Ticker() {
  const [pos, setPos] = useState(0);
  const total = tickerFacts.length;

  useEffect(() => {
    const t = setInterval(() => setPos((p) => (p + 1) % total), 3500);
    return () => clearInterval(t);
  }, [total]);

  return (
    <div
      style={{
        background: "rgba(245,158,11,0.06)",
        borderTop: "1px solid rgba(245,158,11,0.15)",
        borderBottom: "1px solid rgba(245,158,11,0.15)",
        padding: "8px 0",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          paddingLeft: 24,
        }}
      >
        <span
          style={{
            background: "#F59E0B",
            color: "#0A0A0A",
            fontSize: 10,
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: 3,
            letterSpacing: "0.08em",
            flexShrink: 0,
          }}
        >
          DID YOU KNOW
        </span>
        <div style={{ overflow: "hidden", flex: 1 }}>
          <div
            style={{
              color: "#D0D6E0",
              fontSize: 13,
              fontWeight: 510,
              transition: "transform 0.4s ease, opacity 0.4s ease",
              letterSpacing: "-0.165px",
            }}
          >
            {tickerFacts[pos]}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Nav({ onStart }) {
  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(8,9,10,0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        height: 56,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <BrandLogo size="md" />
        <span
          style={{
            fontSize: 10,
            color: "#F59E0B",
            background: "rgba(245,158,11,0.1)",
            border: "1px solid rgba(245,158,11,0.2)",
            padding: "1px 6px",
            borderRadius: 4,
            fontWeight: 510,
            letterSpacing: "0.04em",
          }}
        >
          BETA
        </span>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {["The Problem", "Simulator", "Learn"].map((label) => (
          <button
            key={label}
            style={{
              background: "transparent",
              border: "none",
              color: "#8A8F98",
              fontSize: 13,
              fontWeight: 510,
              cursor: "pointer",
              padding: "6px 12px",
              borderRadius: 6,
              letterSpacing: "-0.13px",
            }}
          >
            {label}
          </button>
        ))}
        <button
          onClick={onStart}
          style={{
            background: "#F59E0B",
            border: "none",
            color: "#0A0A0A",
            fontSize: 13,
            fontWeight: 590,
            cursor: "pointer",
            padding: "7px 16px",
            borderRadius: 6,
            letterSpacing: "-0.13px",
          }}
        >
          Start Free →
        </button>
      </div>
    </nav>
  );
}

export function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid rgba(255,255,255,0.05)",
        padding: "28px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <BrandLogo size="sm" />
        <span style={{ color: "#62666D", fontSize: 12 }}>
          FinSim · Built for the Hackathon
        </span>
      </div>
      <div style={{ display: "flex", gap: 24 }}>
        <span style={{ color: "#62666D", fontSize: 12 }}>No data stored</span>
        <span style={{ color: "#62666D", fontSize: 12 }}>
          No account required
        </span>
        <span style={{ color: "#62666D", fontSize: 12 }}>Open source</span>
      </div>
    </footer>
  );
}
