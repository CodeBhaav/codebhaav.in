import { motion } from "motion/react";
import { OrbitingCircles } from "@/components/react/ui/orbiting-circles";

export function HeroVisual() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[460px]">
      {/* soft warm halo, matched to hero spotlights */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(245, 158, 11, 0.18) 0%, transparent 60%)",
        }}
      />

      {/* outer orbit (slow, reverse)  stack chips */}
      <OrbitingCircles radius={170} duration={45} reverse iconSize={26} path>
        <OrbitChip label="Astro" />
        <OrbitChip label="Convex" />
        <OrbitChip label="React" />
        <OrbitChip label="Tailwind" />
        <OrbitChip label="TypeScript" />
        <OrbitChip label="Cloudflare" />
      </OrbitingCircles>

      {/* inner orbit  amber/muted dots */}
      <OrbitingCircles radius={108} duration={22} iconSize={10} path>
        <OrbitDot tone="amber" />
        <OrbitDot tone="muted" />
        <OrbitDot tone="amber" />
        <OrbitDot tone="muted" />
      </OrbitingCircles>

      {/* tiny center pulse mark */}
      <motion.div
        aria-hidden
        className="absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_24px_rgba(245,158,11,0.6)]"
        animate={{ scale: [1, 1.4, 1], opacity: [0.85, 1, 0.85] }}
        transition={{
          duration: 2.4,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

function OrbitChip({ label }: { label: string }) {
  return (
    <div className="rounded-badge border border-border bg-surface/80 px-2 py-0.5 backdrop-blur-sm">
      <span className="whitespace-nowrap font-mono text-[10px] uppercase tracking-wider text-text-secondary">
        {label}
      </span>
    </div>
  );
}

function OrbitDot({ tone }: { tone: "amber" | "muted" }) {
  return (
    <div
      className={
        tone === "amber"
          ? "size-2 rounded-full bg-accent shadow-[0_0_10px_rgba(245,158,11,0.6)]"
          : "size-1.5 rounded-full bg-text-muted/50"
      }
    />
  );
}
