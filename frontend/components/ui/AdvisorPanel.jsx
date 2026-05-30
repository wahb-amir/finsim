"use client";

import { useState, useRef, useEffect } from "react";
import { requestAdvisor } from "@/lib/api";

const MAX_ADVISOR_CALLS = 4;

export function AdvisorPanel({
  sessionId,
  round,
  advisorMessages = [],
  advisorCallsUsed = 0,
  onAdvisorUpdate,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [typingId, setTypingId] = useState(null);
  const [displayedText, setDisplayedText] = useState("");
  const messagesEndRef = useRef(null);

  const remainingUses = Math.max(0, MAX_ADVISOR_CALLS - advisorCallsUsed);
  const canAsk = Boolean(sessionId) && remainingUses > 0 && !isLoading;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [advisorMessages, displayedText]);

  const typeMessage = (message, id) => {
    setTypingId(id);
    setDisplayedText("");
    let i = 0;
    const speed = 16;

    const type = () => {
      if (i < message.length) {
        setDisplayedText(message.slice(0, i + 1));
        i += 1;
        setTimeout(type, speed);
      } else {
        setTypingId(null);
        setDisplayedText("");
      }
    };

    type();
  };

  const handleAskAdvisor = async () => {
    if (!canAsk) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await requestAdvisor(sessionId);
      onAdvisorUpdate?.({
        advisorMessages: data.advisorMessages,
        advisorCallsUsed: data.advisorCallsUsed,
        advisorRemainingUses: data.remainingUses,
      });
      typeMessage(data.message, Date.now());
    } catch (err) {
      setError(err.message || "Could not reach the advisor");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-2 mb-4 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M7 1L8.5 5H13L9.5 7.5L11 12L7 9.5L3 12L4.5 7.5L1 5H5.5L7 1Z"
                fill="#F59E0B"
              />
            </svg>
          </div>
          <div>
            <div
              className="text-[12px] font-semibold text-[#F5F5F5]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              FinSim Advisor
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-green-pulse" />
              <span className="text-[10px] text-[#6B6B6B]">
                {remainingUses} of {MAX_ADVISOR_CALLS} uses left
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 rounded-xl bg-[#0D0D0D] border border-[#1A1A1A] p-4 mb-3">
        {advisorMessages.length === 0 && !isLoading && !typingId ? (
          <p className="text-[12px] leading-relaxed text-[#6B6B6B]">
            Need a nudge before you decide? Ask the advisor for a Socratic question
            grounded in your current finances — up to {MAX_ADVISOR_CALLS} times per game.
          </p>
        ) : (
          <div className="space-y-4">
            {advisorMessages.map((entry, index) => {
              const isLatestTyping =
                typingId && index === advisorMessages.length - 1;
              const text = isLatestTyping ? displayedText : entry.message;

              return (
                <div key={`${entry.round}-${entry.timestamp}-${index}`} className="flex gap-2">
                  <div className="w-5 h-5 rounded flex-shrink-0 mt-0.5 bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center">
                    <span className="text-[8px] text-[#F59E0B] font-bold">AI</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-[#6B6B6B] mb-1">Round {entry.round}</p>
                    <p
                      className={`text-[12px] leading-relaxed text-[#D1D1D1] ${isLatestTyping && typingId ? "cursor-blink" : ""}`}
                    >
                      {text}
                    </p>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-1.5 py-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] dot-1" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] dot-2" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] dot-3" />
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <p className="text-[11px] text-[#EF4444] mb-2 flex-shrink-0">{error}</p>
      )}

      <button
        type="button"
        onClick={handleAskAdvisor}
        disabled={!canAsk}
        className="flex-shrink-0 w-full py-2.5 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#F59E0B] text-[12px] font-medium hover:bg-[#F59E0B]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        {isLoading
          ? "Thinking…"
          : remainingUses === 0
            ? "Advisor limit reached"
            : `Ask Advisor (Round ${round})`}
      </button>
    </div>
  );
}
