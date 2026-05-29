"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
};

export function BottomSheet({
  open,
  onClose,
  title,
  description,
  children,
  initialFocusRef,
}: BottomSheetProps) {
  const reduced = useReducedMotion();
  const titleId = React.useId();
  const descId = React.useId();
  const closeBtnRef = React.useRef<HTMLButtonElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      const el = initialFocusRef?.current ?? closeBtnRef.current;
      el?.focus?.();
    }, 0);
    return () => clearTimeout(t);
  }, [open, initialFocusRef]);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close sheet"
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              transition: { duration: reduced ? 0 : 0.16 },
            }}
            exit={{ opacity: 0, transition: { duration: reduced ? 0 : 0.12 } }}
          />

          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descId : undefined}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md"
            initial={{ y: 40, opacity: 0.9 }}
            animate={{
              y: 0,
              opacity: 1,
              transition: {
                type: reduced ? "tween" : "spring",
                damping: 26,
                stiffness: 260,
              },
            }}
            exit={{
              y: 40,
              opacity: 0.9,
              transition: { duration: reduced ? 0 : 0.16 },
            }}
          >
            <div className="rounded-t-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-[0_-18px_60px_rgba(0,0,0,0.55)]">
              <div className="px-4 pt-3 pb-2">
                <div
                  className="mx-auto mb-2 h-1 w-10 rounded-full bg-white/10"
                  aria-hidden="true"
                />
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <h2
                      id={titleId}
                      className="text-[13px] font-semibold tracking-tight text-[color:var(--color-text-primary)]"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {title}
                    </h2>
                    {description ? (
                      <p
                        id={descId}
                        className="mt-1 text-[11px] text-[color:var(--color-text-muted)]"
                      >
                        {description}
                      </p>
                    ) : null}
                  </div>
                  <button
                    ref={closeBtnRef}
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-white/10 bg-white/5 p-2 text-[color:var(--color-text-secondary)] transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-amber)]"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="max-h-[70vh] overflow-y-auto px-4 pb-6 pt-2">
                {children}
              </div>
            </div>
          </motion.section>
        </>
      ) : null}
    </AnimatePresence>
  );
}
