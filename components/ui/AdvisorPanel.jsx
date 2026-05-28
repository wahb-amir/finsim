"use client";

import { useState, useEffect, useRef } from "react";
import { getAdvisorMessage } from "@/lib/api";
import { useGame } from "@/context/GameContext";

export function AdvisorPanel({ round, metrics }) {
  const { advisorMessages, addAdvisorMessage } = useGame();
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [followUp, setFollowUp] = useState("");
  const [followUpResponse, setFollowUpResponse] = useState("");
  const [isFollowUpLoading, setIsFollowUpLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const currentMessageRef = useRef("");

  const typeMessage = (message) => {
    setIsTyping(true);
    setDisplayedText("");
    currentMessageRef.current = "";
    let i = 0;
    const speed = 18;

    const type = () => {
      if (i < message.length) {
        currentMessageRef.current += message[i];
        setDisplayedText(currentMessageRef.current);
        i++;
        setTimeout(type, speed);
      } else {
        setIsTyping(false);
      }
    };

    type();
  };

  useEffect(() => {
    const loadMessage = async () => {
      setIsLoading(true);
      setDisplayedText("");
      setFollowUpResponse("");
      try {
        const msg = await getAdvisorMessage(round, metrics, {});
        addAdvisorMessage(msg);
        setIsLoading(false);
        typeMessage(msg);
      } catch {
        setIsLoading(false);
        typeMessage("What does this decision say about how you value security versus growth?");
      }
    };
    loadMessage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayedText, followUpResponse]);

  const handleFollowUp = async () => {
    if (!followUp.trim() || isFollowUpLoading) return;
    const question = followUp;
    setFollowUp("");
    setIsFollowUpLoading(true);

    await new Promise((r) => setTimeout(r, 1000));
    setIsFollowUpLoading(false);

    const responses = [
      "That's worth reflecting on. Consider how this choice fits into your longer arc — not just today's comfort.",
      "Good question. The answer depends on your risk tolerance, but also on what 'security' truly means to you.",
      "Think about what you'd regret more in 5 years: the risk you took, or the one you didn't.",
      "That instinct you're feeling? That's worth examining. Is it based on data, or fear?",
      "Most financial mistakes aren't from bad math — they're from letting emotion override a plan.",
    ];
    const reply = responses[Math.floor(Math.random() * responses.length)];
    setFollowUpResponse(reply);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4 flex-shrink-0">
        <div className="relative">
          <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L8.5 5H13L9.5 7.5L11 12L7 9.5L3 12L4.5 7.5L1 5H5.5L7 1Z" fill="#F59E0B" />
            </svg>
          </div>
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
            <span className="text-[10px] text-[#6B6B6B]">Active</span>
          </div>
        </div>
      </div>

      {/* Message area */}
      <div className="flex-1 overflow-y-auto min-h-0 rounded-xl bg-[#0D0D0D] border border-[#1A1A1A] p-4 mb-3">
        {isLoading ? (
          <div className="flex items-center gap-1.5 py-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] dot-1" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] dot-2" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] dot-3" />
          </div>
        ) : (
          <div className="space-y-3">
            {/* Advisor question */}
            <div className="flex gap-2">
              <div className="w-5 h-5 rounded flex-shrink-0 mt-0.5 bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center">
                <span className="text-[8px] text-[#F59E0B] font-bold">AI</span>
              </div>
              <p
                className={`text-[12px] leading-relaxed text-[#D1D1D1] ${isTyping ? "cursor-blink" : ""}`}
              >
                {displayedText}
              </p>
            </div>

            {/* Follow-up loading */}
            {isFollowUpLoading && (
              <div className="flex items-center gap-1.5 pl-7">
                <div className="w-1.5 h-1.5 rounded-full bg-[#A1A1A1] dot-1" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#A1A1A1] dot-2" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#A1A1A1] dot-3" />
              </div>
            )}

            {/* Follow-up response */}
            {followUpResponse && (
              <div className="flex gap-2">
                <div className="w-5 h-5 rounded flex-shrink-0 mt-0.5 bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center">
                  <span className="text-[8px] text-[#F59E0B] font-bold">AI</span>
                </div>
                <p className="text-[12px] leading-relaxed text-[#D1D1D1]">{followUpResponse}</p>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Follow-up input */}
      <div className="flex-shrink-0 flex gap-2">
        <input
          type="text"
          value={followUp}
          onChange={(e) => setFollowUp(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleFollowUp()}
          placeholder="Ask the advisor..."
          className="flex-1 bg-[#111111] border border-[#242424] rounded-lg px-3 py-2 text-[11px] text-[#F5F5F5] placeholder-[#4A4A4A] focus:outline-none focus:border-[#F59E0B]/50 transition-colors"
          aria-label="Ask the advisor a follow-up question"
        />
        <button
          onClick={handleFollowUp}
          disabled={!followUp.trim() || isFollowUpLoading}
          className="px-3 py-2 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/20 text-[#F59E0B] text-[11px] font-medium hover:bg-[#F59E0B]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          aria-label="Send question to advisor"
        >
          Send
        </button>
      </div>
    </div>
  );
}
