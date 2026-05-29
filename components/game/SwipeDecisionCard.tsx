"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, AlertTriangle, Sparkles } from "lucide-react";

import type { EventCard, ChoiceId } from "@/lib/sim";

type Props = {
  event: EventCard;
  disabled?: boolean;
  reducedMotionOverride?: boolean;
  onChoose: (choice: ChoiceId) => void;
};

export function SwipeDecisionCard({ event, disabled, reducedMotionOverride, onChoose }: Props) {
  const reduced = useReducedMotion() || !!reducedMotionOverride;
  const [hint, setHint] = React.useState<"left" | "right" | null>(null);

  const swipeThreshold = 90;

  return (
    <div className="relative">
      <div className="mb-3 flex items-start gap-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5"
          aria-hidden="true"
        >
          {event.crisis ? (
            <AlertTriangle className="h-4 w-4 text-[color:var(--color-red)]" />
          ) : (
            <Sparkles className="h-4 w-4 text-[color:var(--color-amber)]" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-wide ${
                event.crisis
                  ? "border-[color:var(--color-red)]/25 bg-[color:var(--color-red)]/10 text-[color:var(--color-red)]"
                  : "border-white/10 bg-white/5 text-[color:var(--color-text-muted)]"
              }`}
            >
              {event.crisis ? "CRISIS" : event.tag.toUpperCase()}
            </span>
          </div>
          <h1
            className="mt-1 text-[18px] font-bold leading-snug text-[color:var(--color-text-primary)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {event.title}
          </h1>
          <p className="mt-1 text-[12px] leading-relaxed text-[color:var(--color-text-secondary)]">
            {event.description}
          </p>
        </div>
      </div>

      <div className="relative rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 noise-overlay">
        <div className="pointer-events-none absolute inset-x-0 top-3 flex items-center justify-between px-3 text-[10px] text-[color:var(--color-text-muted)]">
          <span className="inline-flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" aria-hidden="true" />
            Swipe left
          </span>
          <span className="inline-flex items-center gap-1">
            Swipe right
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </span>
        </div>

        <motion.button
          type="button"
          disabled={disabled}
          className="relative mt-5 w-full rounded-xl border border-white/10 bg-[color:var(--color-surface-raised)] p-4 text-left shadow-[0_14px_40px_rgba(0,0,0,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-amber)] disabled:opacity-60"
          drag={reduced ? false : "x"}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.18}
          onDrag={(e, info) => {
            if (reduced) return;
            const x = info.offset.x;
            if (x < -40) setHint("left");
            else if (x > 40) setHint("right");
            else setHint(null);
          }}
          onDragEnd={(e, info) => {
            if (reduced) return;
            const x = info.offset.x;
            setHint(null);
            if (x <= -swipeThreshold) onChoose("left");
            if (x >= swipeThreshold) onChoose("right");
          }}
          whileTap={reduced ? undefined : { scale: 0.99 }}
          animate={
            reduced
              ? undefined
              : {
                  boxShadow:
                    hint === "left"
                      ? "0 18px 60px rgba(239,68,68,0.08)"
                      : hint === "right"
                        ? "0 18px 60px rgba(16,185,129,0.08)"
                        : "0 14px 40px rgba(0,0,0,0.45)",
                }
          }
          aria-label="Decision card. Swipe left or right to choose."
        >
          <div className="grid grid-cols-2 gap-3">
            <div
              className={`rounded-lg border p-3 transition ${
                hint === "left"
                  ? "border-[color:var(--color-amber)]/30 bg-[color:var(--color-amber)]/10"
                  : "border-white/10 bg-white/5"
              }`}
            >
              <div className="text-[11px] font-semibold text-[color:var(--color-text-primary)]">
                {event.left.title}
              </div>
              <ul className="mt-2 space-y-1">
                {event.left.bullets.map((b, i) => (
                  <li key={i} className="text-[11px] leading-snug text-[color:var(--color-text-secondary)]">
                    <span className="mr-2 inline-block h-1 w-1 rounded-full bg-white/25 align-middle" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            <div
              className={`rounded-lg border p-3 transition ${
                hint === "right"
                  ? "border-[color:var(--color-amber)]/30 bg-[color:var(--color-amber)]/10"
                  : "border-white/10 bg-white/5"
              }`}
            >
              <div className="text-[11px] font-semibold text-[color:var(--color-text-primary)]">
                {event.right.title}
              </div>
              <ul className="mt-2 space-y-1">
                {event.right.bullets.map((b, i) => (
                  <li key={i} className="text-[11px] leading-snug text-[color:var(--color-text-secondary)]">
                    <span className="mr-2 inline-block h-1 w-1 rounded-full bg-white/25 align-middle" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {reduced ? (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[12px] font-semibold text-[color:var(--color-text-primary)] hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-amber)] disabled:opacity-60"
                onClick={() => onChoose("left")}
                disabled={disabled}
                aria-label="Choose left option"
              >
                Choose left
              </button>
              <button
                type="button"
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[12px] font-semibold text-[color:var(--color-text-primary)] hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-amber)] disabled:opacity-60"
                onClick={() => onChoose("right")}
                disabled={disabled}
                aria-label="Choose right option"
              >
                Choose right
              </button>
            </div>
          ) : null}
        </motion.button>
      </div>
    </div>
  );
}

