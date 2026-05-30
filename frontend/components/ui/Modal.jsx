"use client";
import { useEffect } from "react";

export default function Modal({ isOpen, onClose, title, message }) {
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(6px)",
          cursor: "pointer",
        }}
      />
      {/* Modal Dialog */}
      <div
        style={{
          position: "relative",
          background: "#08090A",
          border: "1px solid rgba(245,158,11,0.2)",
          borderRadius: 16,
          padding: "32px",
          maxWidth: "420px",
          width: "90%",
          textAlign: "center",
          boxShadow:
            "0 20px 40px rgba(0,0,0,0.5), 0 0 40px rgba(245,158,11,0.1)",
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 16 }}>🚀</div>
        <h3
          style={{
            color: "#F7F8F8",
            fontSize: 24,
            fontWeight: 590,
            margin: "0 0 12px",
            letterSpacing: "-0.5px",
          }}
        >
          {title}
        </h3>
        <p
          style={{
            color: "#8A8F98",
            fontSize: 15,
            lineHeight: 1.6,
            margin: "0 0 24px",
          }}
        >
          {message}
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.05)",
              color: "#F7F8F8",
              border: "1px solid rgba(255,255,255,0.1)",
              padding: "12px 24px",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 510,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            style={{
              background: "#F59E0B",
              color: "#0A0A0A",
              border: "none",
              padding: "12px 24px",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 590,
              cursor: "pointer",
            }}
          >
            Continue to Auth →
          </button>
        </div>
      </div>
    </div>
  );
}
