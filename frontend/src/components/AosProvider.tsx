"use client";

import { useEffect, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

export function AosProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    AOS.init({
      duration: 700,
      easing: "ease-out-cubic",
      once: true,
      offset: 80,
      disable: () =>
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    });

    const handleAosIn = (e: Event) => {
      const customEvent = e as CustomEvent<HTMLElement>;
      if (customEvent.detail) {
        customEvent.detail.setAttribute("data-aos-completed", "true");
      }
    };

    document.addEventListener("aos:in", handleAosIn);

    return () => {
      document.removeEventListener("aos:in", handleAosIn);
    };
  }, []);

  return (
    <>
      {children}
      <BackToTop />
      <OnlineStatus />
    </>
  );
}

function OnlineStatus() {
  const [state, setState] = useState<"online" | "offline" | "reconnected">("online");

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    // navigator.onLine lies in some browsers (stuck false while connected),
    // so confirm with a real heartbeat before crying offline.
    async function verify(): Promise<boolean> {
      if (typeof navigator !== "undefined" && navigator.onLine) return true;
      try {
        const envBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
        const origin = envBase.replace(/\/+$/, "").replace(/\/api\/v1$/, "");
        const ctrl = new AbortController();
        timer = setTimeout(() => ctrl.abort(), 6000);
        const res = await fetch(`${origin}/health`, {
          method: "GET",
          cache: "no-store",
          signal: ctrl.signal,
        });
        return res.ok;
      } catch {
        return false;
      } finally {
        if (timer) clearTimeout(timer);
      }
    }

    async function refresh(isInitial = false) {
      const ok = await verify();
      if (cancelled) return;
      if (ok) setState(isInitial ? "online" : "reconnected");
      else setState("offline");
    }

    // Initial check: only show the banner if we are really unreachable.
    refresh(true);
    const onDown = () => refresh();
    const onUp = () => refresh();
    window.addEventListener("offline", onDown);
    window.addEventListener("online", onUp);
    return () => {
      cancelled = true;
      window.removeEventListener("offline", onDown);
      window.removeEventListener("online", onUp);
    };
  }, []);

  useEffect(() => {
    if (state !== "reconnected") return;
    const t = setTimeout(() => setState("online"), 3000);
    return () => clearTimeout(t);
  }, [state]);

  if (state === "online") return null;

  return (
    <div
      role="status"
      className={`fixed top-3 left-1/2 -translate-x-1/2 z-[70] rounded-full px-4 py-2 text-xs font-semibold shadow-lg max-w-[calc(100vw-2rem)] truncate ${
        state === "offline" ? "bg-red-800 text-white" : "bg-teal-700 text-white"
      }`}
    >
      {state === "offline" ? "You're offline. Some features may be unavailable." : "You're back online."}
    </div>
  );
}

function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  const scrollTop = () => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      onClick={scrollTop}
      aria-label="Back to top"
      className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 w-11 h-11 rounded-full bg-stone-900 text-white shadow-lg hover:bg-stone-800 active:scale-95 flex items-center justify-center transition-all min-h-[44px] min-w-[44px]"
    >
      <i className="fa fa-arrow-up" aria-hidden="true" />
    </button>
  );
}

