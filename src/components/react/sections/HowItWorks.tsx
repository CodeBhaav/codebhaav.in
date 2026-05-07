import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "motion/react";
import { FlickeringGrid } from "@/components/react/ui/flickering-grid";
import { cn } from "@/lib/utils";

type Step = {
  id: number;
  title: string;
  headline: string;
  body: string;
  mock: "wizard" | "match" | "build" | "ship";
};

const STEPS: Step[] = [
  {
    id: 1,
    title: "Join the waitlist",
    headline: "Tell us who you are.",
    body: "An AI step-wizard asks one question at a time: your role, what you build, what you're stuck on. No long forms.",
    mock: "wizard",
  },
  {
    id: 2,
    title: "Get matched",
    headline: "Find your people.",
    body: "When we open, you'll be paired with developers at your level building things you care about. No randos, no clout chasers.",
    mock: "match",
  },
  {
    id: 3,
    title: "Build together",
    headline: "Ship real projects.",
    body: "Pair on side projects, review each other's PRs, run sprint weekends. The point is shipping, not collecting tutorial badges.",
    mock: "build",
  },
  {
    id: 4,
    title: "Move up the line",
    headline: "Refer, climb, repeat.",
    body: "Every developer you bring moves you up the leaderboard. Top referrers and earliest signups get founding-tier access first.",
    mock: "ship",
  },
];

const TRANSITION = { duration: 0.35, ease: "easeInOut" as const };

function MockWizard() {
  return (
    <div className="bg-card border border-border rounded-card p-6 max-w-md mx-auto shadow-2xl">
      <div className="flex items-center gap-2 pb-4 border-b border-border">
        <span className="size-2 rounded-full bg-success animate-pulse" />
        <span className="font-mono text-xs text-text-muted">step 3 of 5</span>
      </div>
      <p className="mt-4 font-mono text-[11px] uppercase tracking-wider text-text-muted">
        CodeBhaav AI
      </p>
      <p className="mt-2 text-base text-text-primary leading-relaxed font-medium">
        What's the last thing you shipped? Even a half-broken weekend project
        counts.
      </p>
      <div className="mt-5 rounded-button border border-accent bg-accent/5 px-3 py-2">
        <p className="font-mono text-sm text-text-primary">
          a discord bot that pings me when_
        </p>
      </div>
      <div className="mt-4 flex justify-end">
        <div className="rounded-button bg-accent px-4 py-2 text-xs font-medium text-white">
          Continue →
        </div>
      </div>
    </div>
  );
}

function MockMatch() {
  const matches = [
    { name: "your.frontend.pair", role: "Frontend track", tag: "React, Astro" },
    { name: "your.backend.pair", role: "Backend track", tag: "Go, Postgres" },
    { name: "your.design.pair", role: "Design track", tag: "Figma, CSS" },
  ];
  return (
    <div className="grid gap-3 max-w-md mx-auto">
      {matches.map((m, i) => (
        <motion.div
          key={m.name}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 + i * 0.12, duration: 0.4 }}
          className="bg-card border border-border rounded-card p-4 flex items-center gap-3"
        >
          <div className="size-10 rounded-full bg-gradient-to-br from-accent to-[#F97316] flex items-center justify-center text-white font-semibold text-sm">
            {m.name[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">
              {m.name}
            </p>
            <p className="text-xs text-text-secondary">{m.role}</p>
          </div>
          <span className="hidden sm:inline-block font-mono text-[10px] uppercase tracking-wider text-text-muted bg-surface border border-border rounded-badge px-2 py-1">
            {m.tag}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

function MockBuild() {
  const lines = [
    { author: "frontend", msg: "pushed: hero polish" },
    { author: "backend", msg: "merged: API rate-limit fix" },
    { author: "design", msg: "review: type pass" },
    { author: "you", msg: "shipped: first PR", accent: true },
  ];
  return (
    <div className="bg-card border border-border rounded-card overflow-hidden max-w-md mx-auto">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-surface">
        <span className="size-2.5 rounded-full bg-[#FF5F57]" />
        <span className="size-2.5 rounded-full bg-[#FEBC2E]" />
        <span className="size-2.5 rounded-full bg-[#28C840]" />
        <span className="ml-2 font-mono text-xs text-text-muted">activity</span>
      </div>
      <div className="divide-y divide-border">
        {lines.map((l, i) => (
          <motion.div
            key={l.msg}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.12, duration: 0.3 }}
            className="px-4 py-3 flex items-center gap-3 text-sm"
          >
            <span
              className={cn(
                "font-mono text-xs",
                l.accent ? "text-accent" : "text-text-muted",
              )}
            >
              @{l.author}
            </span>
            <span
              className={cn(
                l.accent
                  ? "text-text-primary font-medium"
                  : "text-text-secondary",
              )}
            >
              {l.msg}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function MockShip() {
  return (
    <div className="bg-card border border-border rounded-card p-6 max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
          Your position
        </p>
        <span className="font-mono text-[11px] text-success">↑ moved up</span>
      </div>
      <p className="mt-2 text-5xl font-semibold tracking-tighter bg-gradient-to-r from-accent to-[#F97316] bg-clip-text text-transparent">
        #01
      </p>
      <div className="mt-4 h-2 w-full rounded-full bg-surface overflow-hidden">
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: "70%" }}
          transition={{ delay: 0.3, duration: 1.2, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-accent to-[#F97316]"
        />
      </div>
      <div className="mt-5 flex items-center justify-between text-xs text-text-secondary">
        <span>Refer to climb</span>
        <span className="text-accent">Founding tier</span>
      </div>
    </div>
  );
}

function StepMock({ mock }: { mock: Step["mock"] }) {
  if (mock === "wizard") return <MockWizard />;
  if (mock === "match") return <MockMatch />;
  if (mock === "build") return <MockBuild />;
  return <MockShip />;
}

const COLLAPSE_DELAY = 5000;

export function HowItWorks() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { amount: 0.3 });
  const [trigger, setTrigger] = useState(0);

  const handleTabClick = useCallback((index: number) => {
    setCurrentIndex(index);
    setTrigger((p) => p + 1);
  }, []);

  useEffect(() => {
    if (!isInView) return;
    const interval = setInterval(() => {
      setCurrentIndex((p) => (p + 1) % STEPS.length);
    }, COLLAPSE_DELAY);
    return () => clearInterval(interval);
  }, [isInView, trigger]);

  const currentStep = STEPS[currentIndex];

  return (
    <div ref={containerRef} className="w-full flex flex-col">
      <div className="grid grid-cols-2 lg:grid-cols-4 border-b border-border">
        {STEPS.map((step, index) => (
          <button
            key={step.id}
            type="button"
            onClick={() => handleTabClick(index)}
            className="relative cursor-pointer overflow-hidden w-full min-h-[56px] px-3 sm:px-5 py-4 text-xs sm:text-sm font-medium text-center transition-colors flex flex-col items-center justify-center gap-1 group [&:not(:first-child)]:border-l border-t border-border"
          >
            {currentIndex === index && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={TRANSITION}
                className="absolute inset-0 -z-10 mask-[linear-gradient(to_bottom,white,transparent)]"
              >
                <FlickeringGrid
                  className="absolute inset-0 size-full"
                  squareSize={3}
                  gridGap={2}
                  color="rgb(245, 158, 11)"
                  maxOpacity={0.4}
                  flickerChance={0.2}
                />
              </motion.div>
            )}
            <span className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
              0{step.id}
            </span>
            <span
              className={cn(
                "text-xs sm:text-sm leading-tight",
                currentIndex === index
                  ? "text-text-primary font-semibold"
                  : "text-text-secondary",
              )}
            >
              {step.title}
            </span>
            {currentIndex === index && (
              <span
                aria-hidden
                className="pointer-events-none absolute bottom-0 left-0 right-0 h-px"
              >
                <motion.span
                  key={`${currentIndex}-${trigger}`}
                  className="absolute inset-0 origin-left bg-accent h-px w-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{
                    duration: COLLAPSE_DELAY / 1000,
                    ease: "linear",
                  }}
                />
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-0">
        <div className="p-8 md:p-12 lg:border-r border-border">
          <AnimatePresence mode="wait">
            <motion.div
              key={`copy-${currentIndex}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={TRANSITION}
            >
              <p className="font-mono text-[11px] uppercase tracking-wider text-accent">
                Step {currentStep.id}
              </p>
              <h3 className="mt-3 text-2xl md:text-3xl font-semibold tracking-tighter text-text-primary">
                {currentStep.headline}
              </h3>
              <p className="mt-4 text-base leading-relaxed text-text-secondary">
                {currentStep.body}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="p-8 md:p-12 flex items-center justify-center min-h-[360px] bg-background relative overflow-hidden">
          <div
            className="absolute inset-0 -z-10 opacity-40"
            style={{
              background:
                "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(245, 158, 11, 0.15), transparent 70%)",
            }}
          />
          <AnimatePresence mode="wait">
            <motion.div
              key={`mock-${currentIndex}`}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={TRANSITION}
              className="w-full"
            >
              <StepMock mock={currentStep.mock} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
