"use client";

import { useEffect, useCallback } from "react";

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}) {
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape" && !loading) onCancel?.();
    },
    [loading, onCancel],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  const confirmStyles =
    confirmVariant === "danger"
      ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
      : "bg-[#F59E0B] border-[#F59E0B] text-black hover:opacity-95";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={loading ? undefined : onCancel}
        aria-label="Close dialog"
      />

      <div className="relative w-full max-w-md rounded-3xl border border-[#2A2A2A] bg-[#0F0F0F] p-6 shadow-2xl animate-fade-in-up">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#2A2A2A] bg-[#161616]">
          {confirmVariant === "danger" ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                stroke="#EF4444"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                stroke="#F59E0B"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          )}
        </div>

        <h2 id="confirm-modal-title" className="text-xl font-bold text-white">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#A1A1A1]">{description}</p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 rounded-xl border px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${confirmStyles}`}
          >
            {loading ? "Please wait…" : confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl border border-[#2A2A2A] bg-[#111111] px-5 py-3 text-sm font-semibold text-white transition hover:border-[#444] disabled:opacity-50"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
