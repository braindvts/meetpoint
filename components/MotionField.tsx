"use client";

import { useEffect } from "react";

const SELECTOR = ".mp-scroll-reveal, .mp-scroll-stagger > *, .mp-scroll-card";

/** Marks sections as they enter the viewport. No-op when motion is reduced. */
export default function MotionField() {
  useEffect(() => {
    if (!document.documentElement.classList.contains("mp-motion")) return;

    const seen = new WeakSet<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      },
      { root: null, rootMargin: "0px 0px -6% 0px", threshold: 0.14 }
    );

    const watch = (node: ParentNode) => {
      node.querySelectorAll(SELECTOR).forEach((el) => {
        if (seen.has(el) || el.classList.contains("is-in")) return;
        seen.add(el);
        io.observe(el);
      });
    };

    watch(document);
    const mo = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches(SELECTOR)) {
            if (!seen.has(node) && !node.classList.contains("is-in")) {
              seen.add(node);
              io.observe(node);
            }
          }
          watch(node);
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}
