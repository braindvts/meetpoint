"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/components/motion/usePrefersReducedMotion";

interface Node {
  x: number;
  y: number;
  ox: number;
  oy: number;
  vx: number;
  vy: number;
}

/**
 * Quiet constellation — Interlink’s motion metaphor.
 * Nodes drift; nearby ones link; the pointer tugs the field.
 */
export default function SignalMesh({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const parent = canvas.parentElement;
    let nodes: Node[] = [];
    let raf = 0;
    let w = 0;
    let h = 0;
    let ptr = { x: 0.62, y: 0.38 };
    let running = true;

    const resize = () => {
      const rect = (parent || canvas).getBoundingClientRect();
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(42, Math.max(18, (w * h) / 18000)));
      nodes = Array.from({ length: count }, () => {
        const x = Math.random() * w;
        const y = Math.random() * h;
        return { x, y, ox: x, oy: y, vx: 0, vy: 0 };
      });
    };

    const onPtr = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      ptr = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
    };

    const draw = () => {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      const mx = ptr.x * w;
      const my = ptr.y * h;

      if (!reduced) {
        for (const n of nodes) {
          const dx = mx - n.x;
          const dy = my - n.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 220 * 220) {
            n.vx += dx * 0.00008;
            n.vy += dy * 0.00008;
          }
          n.vx += (n.ox - n.x) * 0.004;
          n.vy += (n.oy - n.y) * 0.004;
          n.vx *= 0.92;
          n.vy *= 0.92;
          n.x += n.vx;
          n.y += n.vy;
        }
      }

      const link = Math.min(150, Math.max(90, w * 0.12));
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < link) {
            const alpha = (1 - d / link) * 0.28;
            ctx.strokeStyle = `rgba(212,196,168,${alpha.toFixed(3)})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (const n of nodes) {
        const near = Math.hypot(n.x - mx, n.y - my) < 90;
        ctx.beginPath();
        ctx.fillStyle = near ? "rgba(239,230,214,0.95)" : "rgba(212,196,168,0.55)";
        ctx.arc(n.x, n.y, near ? 2.2 : 1.4, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = window.requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPtr, { passive: true });
    if (reduced) {
      draw();
    } else {
      raf = window.requestAnimationFrame(draw);
    }

    return () => {
      running = false;
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPtr);
      window.cancelAnimationFrame(raf);
    };
  }, [reduced]);

  return <canvas ref={canvasRef} className={`il-mesh ${className}`} aria-hidden />;
}
