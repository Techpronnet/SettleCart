"use client";

import { useEffect } from "react";
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

  return <>{children}</>;
}

