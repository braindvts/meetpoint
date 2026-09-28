"use client";

import { useLayoutEffect } from "react";

const SELECTOR = ".mp-scroll-reveal, .mp-scroll-stagger > *, .mp-scroll-card";

function inView(el: Element) {
  const rect = el.getBoundingClientRect();
  const height = window.innerHeight || document.documentElement.clientHeight;
  return rect.bottom > height * 0.06 && rect.top < height * 0.9;
}

/** Reveals sections as they enter. Skipped entirely when motion is reduced. */
export default function MotionField() {
  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const mark = () => {
      document.querySelectorAll(SELECTOR).forEach((el) => {
        if (!el.classList.contains("is-in") && inView(el)) el.classList.add("is-in");
      });
    };

    mark();
    document.documentElement.classList.add("mp-motion");

    let frame = 0;
    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        mark();
      });
    };

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const mo = new MutationObserver(schedule);
    mo.observe(document.body, { childList: true, subtree: true });
    schedule();

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      mo.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
