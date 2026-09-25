"use client";

import { useEffect } from "react";

export function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[90] bg-stone-950/45 animate-fade-in"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="fixed z-[95] inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center sm:p-6 animate-sheet-up sm:animate-fade-in"
      >
        <div
          className="bg-white rounded-t-2xl sm:rounded-2xl border border-stone-200 shadow-2xl w-full sm:max-w-md max-h-[85dvh] flex flex-col overflow-hidden"
          style={{ marginBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="pt-2.5 sm:hidden" aria-hidden="true">
            <div className="mx-auto h-1 w-10 rounded-full bg-stone-300" />
          </div>
          <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-stone-100">
            <h2 className="text-base font-semibold text-stone-900">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={`Close ${title}`}
              autoFocus
              className="p-2 rounded-md text-stone-500 hover:bg-stone-100 hover:text-stone-900 min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              <i className="fa fa-times" aria-hidden="true" />
            </button>
          </div>
          <div className="overflow-y-auto px-5 py-4">{children}</div>
        </div>
      </div>
    </>
  );
}
