import {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import { useUser, SignInButton } from "@clerk/clerk-react";
import { useMutation, useQuery } from "convex/react";
import {
  GraduationCap,
  Briefcase,
  Compass,
  Layout,
  Server,
  Smartphone,
  Palette,
  Sparkles,
  Cloud,
  Database,
  ShieldCheck,
  Gamepad2,
  GitBranch,
  CircuitBoard,
  Braces,
  ArrowRight,
  ArrowLeft,
  Check,
  CornerDownLeft,
} from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { cn } from "@/lib/utils";

interface WaitlistWizardProps {
  referralCode?: string;
  returnUrl?: string;
}

interface FormData {
  role: string;
  interests: string[];
  reason: string;
}

const TOTAL_STEPS = 3;
const REF_KEY = "cb_ref_code";
const MIN_REASON_CHARS = 10;

const ROLE_OPTIONS = [
  {
    value: "student",
    label: "Student",
    description: "Currently studying",
    Icon: GraduationCap,
  },
  {
    value: "professional",
    label: "Professional",
    description: "Working in tech",
    Icon: Briefcase,
  },
  {
    value: "self-learning",
    label: "Self-learning",
    description: "Teaching myself",
    Icon: Compass,
  },
] as const;

const INTEREST_OPTIONS = [
  { value: "Frontend", Icon: Layout },
  { value: "Backend", Icon: Server },
  { value: "Mobile", Icon: Smartphone },
  { value: "UI/UX", Icon: Palette },
  { value: "AI/ML", Icon: Sparkles },
  { value: "DevOps", Icon: Cloud },
  { value: "Data", Icon: Database },
  { value: "Cybersecurity", Icon: ShieldCheck },
  { value: "Game Dev", Icon: Gamepad2 },
  { value: "Open Source", Icon: GitBranch },
  { value: "Embedded / IoT", Icon: CircuitBoard },
  { value: "DSA / Algorithms", Icon: Braces },
] as const;

// ─────────────────────────────────────────────────────────────────
//  Backdrop  sparse animated dots
// ─────────────────────────────────────────────────────────────────

function WizardBackdrop() {
  const dots = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        delay: Math.random() * 4,
        duration: 4 + Math.random() * 4,
      })),
    [],
  );
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(245, 158, 11, 0.08) 1px, transparent 0)",
          backgroundSize: "32px 32px",
          maskImage:
            "radial-gradient(ellipse 60% 60% at 30% 30%, black 0%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 60% 60% at 30% 30%, black 0%, transparent 75%)",
        }}
      />
      {dots.map((d) => (
        <motion.span
          key={d.id}
          className="absolute size-1 rounded-full bg-accent/30"
          style={{ top: `${d.top}%`, left: `${d.left}%` }}
          animate={{ opacity: [0.1, 0.6, 0.1] }}
          transition={{
            duration: d.duration,
            delay: d.delay,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  Sidebar  step number + vertical progress
// ─────────────────────────────────────────────────────────────────

const STEP_META = [
  { eyebrow: "About you", hint: "Tell us who's joining" },
  { eyebrow: "Your interests", hint: "Pick what pulls you" },
  { eyebrow: "Why CodeBhaav", hint: "In your own words" },
];

function WizardSidebar({
  step,
  interestsCount,
}: {
  step: number;
  interestsCount: number;
}) {
  const meta = STEP_META[Math.min(step, STEP_META.length - 1)];
  return (
    <aside className="relative flex flex-col justify-between border-b border-border bg-surface/30 px-6 py-8 lg:border-b-0 lg:border-r lg:px-10 lg:py-14">
      <WizardBackdrop />
      <div className="relative z-10">
        <p className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
          {meta.eyebrow}
        </p>

        <div className="mt-6 flex items-end gap-4">
          <AnimatePresence mode="wait">
            <motion.span
              key={step}
              initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -14, filter: "blur(8px)" }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="font-mono text-7xl font-semibold tracking-tighter text-text-primary leading-none lg:text-8xl"
            >
              {String(step + 1).padStart(2, "0")}
            </motion.span>
          </AnimatePresence>
          <span className="mb-2 font-mono text-base text-text-muted">
            / {String(TOTAL_STEPS).padStart(2, "0")}
          </span>
        </div>

        <p className="mt-4 max-w-[260px] text-sm leading-relaxed text-text-secondary">
          {meta.hint}
        </p>
      </div>

      {/* progress dots */}
      <div className="relative z-10 mt-10 flex items-center gap-3 lg:mt-0">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => {
          const state = i < step ? "done" : i === step ? "active" : "pending";
          return (
            <div key={`dot-${i}`} className="flex items-center gap-3">
              <div
                className={cn(
                  "flex size-7 items-center justify-center rounded-full border transition-all",
                  state === "done" && "border-accent bg-accent text-[#1a1208]",
                  state === "active" &&
                    "border-accent bg-accent/10 text-accent shadow-[0_0_0_4px_rgba(245,158,11,0.08)]",
                  state === "pending" &&
                    "border-border bg-card text-text-muted",
                )}
              >
                {state === "done" ? (
                  <Check className="size-3.5" strokeWidth={3} />
                ) : (
                  <span className="font-mono text-[11px]">{i + 1}</span>
                )}
              </div>
              {i < TOTAL_STEPS - 1 && (
                <span
                  className={cn(
                    "h-px w-8 transition-colors",
                    i < step ? "bg-accent" : "bg-border",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {step === 1 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative z-10 mt-6 hidden font-mono text-[11px] uppercase tracking-wider text-text-muted lg:block"
        >
          {interestsCount} selected
        </motion.p>
      )}
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────
//  Main pane primitives
// ─────────────────────────────────────────────────────────────────

function PromptHeading({ text }: { text: string }) {
  const words = text.split(" ");
  return (
    <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-tighter text-balance">
      {words.map((w, i) => (
        <motion.span
          // biome-ignore lint/suspicious/noArrayIndexKey: stable ordered words
          key={`${w}-${i}`}
          initial={{ y: "0.4em", opacity: 0, filter: "blur(6px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0)" }}
          transition={{
            duration: 0.55,
            delay: i * 0.04,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="inline-block whitespace-pre"
        >
          {w}
          {i < words.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </h1>
  );
}

function PrimaryButton({
  disabled,
  loading,
  onClick,
  children,
}: {
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(
        "group inline-flex h-12 min-w-[180px] items-center justify-center gap-2 rounded-button bg-gradient-to-b from-[#F59E0B] to-[#D97706] px-7 text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] ring-1 ring-[#D97706] transition-all",
        "hover:from-[#FBBF24] hover:to-[#F59E0B] active:translate-y-px",
        "disabled:cursor-not-allowed disabled:bg-none disabled:bg-surface disabled:text-text-muted disabled:shadow-none disabled:ring-border disabled:hover:from-surface disabled:hover:to-surface",
      )}
    >
      {loading ? "Submitting..." : children}
      {!loading && (
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5 group-disabled:hidden" />
      )}
    </button>
  );
}

function SecondaryButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-12 items-center gap-2 rounded-button border border-border bg-transparent px-5 text-sm text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
    >
      <ArrowLeft className="size-4" />
      {children}
    </button>
  );
}

function KeyboardHint({ children }: { children: ReactNode }) {
  return (
    <div className="hidden items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-text-muted lg:flex">
      {children}
    </div>
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-[4px] border border-border bg-card px-1.5 text-[10px] text-text-secondary">
      {children}
    </kbd>
  );
}

// ─────────────────────────────────────────────────────────────────
//  Step 1  Role
// ─────────────────────────────────────────────────────────────────

function RoleStep({
  name,
  value,
  onChange,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-10">
      <PromptHeading text={`Hey ${name}, what do you do?`} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {ROLE_OPTIONS.map((opt, i) => {
          const Icon = opt.Icon;
          const isSelected = value === opt.value;
          return (
            <motion.button
              type="button"
              key={opt.value}
              onClick={() => onChange(opt.value)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.45,
                delay: 0.2 + i * 0.06,
                ease: [0.16, 1, 0.3, 1],
              }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "group relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-card border bg-card p-5 text-left transition-colors",
                "hover:border-border-hover",
                isSelected
                  ? "border-accent/60 bg-accent/[0.04]"
                  : "border-border",
              )}
            >
              {isSelected && (
                <motion.div
                  layoutId="role-glow"
                  className="pointer-events-none absolute inset-0 -z-10"
                  style={{
                    background:
                      "radial-gradient(ellipse 70% 80% at 50% 100%, rgba(245, 158, 11, 0.18), transparent 70%)",
                  }}
                />
              )}
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-button border transition-colors",
                  isSelected
                    ? "border-accent/40 bg-accent/10 text-accent"
                    : "border-border bg-surface text-text-secondary group-hover:text-text-primary",
                )}
              >
                <Icon className="size-5" strokeWidth={1.6} />
              </div>

              <div className="flex w-full items-end justify-between">
                <div>
                  <p className="text-base font-semibold tracking-tight text-text-primary">
                    {opt.label}
                  </p>
                  <p className="mt-1 text-[13px] text-text-secondary">
                    {opt.description}
                  </p>
                </div>
                <Kbd>{i + 1}</Kbd>
              </div>

              {isSelected && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-accent text-[#1a1208]"
                >
                  <Check className="size-3" strokeWidth={3} />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  Step 2  Interests
// ─────────────────────────────────────────────────────────────────

function InterestsStep({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (interest: string) => void;
}) {
  return (
    <div className="space-y-10">
      <PromptHeading text="What gets you excited?" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {INTEREST_OPTIONS.map((opt, i) => {
          const Icon = opt.Icon;
          const isSelected = selected.includes(opt.value);
          return (
            <motion.button
              type="button"
              key={opt.value}
              onClick={() => onToggle(opt.value)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: 0.18 + i * 0.04,
                ease: [0.16, 1, 0.3, 1],
              }}
              whileTap={{ scale: 0.96 }}
              className={cn(
                "relative flex items-center gap-3 overflow-hidden rounded-card border bg-card px-4 py-3.5 text-left transition-all",
                isSelected
                  ? "border-accent/50 bg-accent/[0.06] shadow-[0_0_0_3px_rgba(245,158,11,0.06)]"
                  : "border-border hover:border-border-hover hover:bg-surface",
              )}
            >
              <div
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-button border transition-colors",
                  isSelected
                    ? "border-accent/40 bg-accent/15 text-accent"
                    : "border-border bg-surface text-text-secondary",
                )}
              >
                <Icon className="size-[18px]" strokeWidth={1.6} />
              </div>
              <span
                className={cn(
                  "flex-1 text-sm font-medium",
                  isSelected ? "text-text-primary" : "text-text-secondary",
                )}
              >
                {opt.value}
              </span>
              <AnimatePresence>
                {isSelected && (
                  <motion.span
                    key="check"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 25,
                    }}
                    className="flex size-5 items-center justify-center rounded-full bg-accent text-[#1a1208]"
                  >
                    <Check className="size-3" strokeWidth={3} />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      <p className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
        {selected.length === 0
          ? "Pick at least one"
          : `${selected.length} selected`}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  Step 3  Reason
// ─────────────────────────────────────────────────────────────────

function ReasonStep({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const trimmed = value.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
  const ok = trimmed.length >= MIN_REASON_CHARS;

  return (
    <div className="space-y-10">
      <PromptHeading text="Last one  why CodeBhaav?" />

      <div className="space-y-3">
        <div
          className={cn(
            "relative rounded-card border bg-card transition-colors",
            "focus-within:border-accent/60 focus-within:shadow-[0_0_0_3px_rgba(245,158,11,0.10)]",
            ok ? "border-accent/40" : "border-border",
          )}
        >
          <textarea
            ref={ref}
            placeholder="What are you trying to learn or build? What pulls you to a community like this?"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={5}
            autoFocus
            className="w-full resize-y bg-transparent px-5 py-4 text-base leading-relaxed text-text-primary placeholder:text-text-muted outline-none min-h-[160px]"
          />
          <div className="flex items-center justify-between gap-4 border-t border-border px-5 py-2.5 font-mono text-[11px] uppercase tracking-wider text-text-muted">
            <span>
              {wordCount} {wordCount === 1 ? "word" : "words"}
            </span>
            <span className={cn(ok && "text-success")}>
              {ok
                ? "Looks good"
                : `${MIN_REASON_CHARS - trimmed.length} chars to go`}
            </span>
          </div>
        </div>

        <p className="text-[12px] leading-relaxed text-text-muted">
          By continuing, you agree to our{" "}
          <a
            href="/terms"
            className="text-text-secondary underline underline-offset-2 hover:text-text-primary"
          >
            Terms
          </a>{" "}
          and{" "}
          <a
            href="/privacy"
            className="text-text-secondary underline underline-offset-2 hover:text-text-primary"
          >
            Privacy
          </a>
          .
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  Success
// ─────────────────────────────────────────────────────────────────

function SuccessScreen({
  name,
  referralCode,
  position,
}: {
  name: string;
  referralCode: string;
  position: number;
}) {
  const [copied, setCopied] = useState(false);
  const referralLink = `${window.location.origin}/waitlist?ref=${referralCode}`;

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [referralLink]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto w-full max-w-xl text-center"
    >
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.1 }}
        className="mx-auto mb-6 flex size-14 items-center justify-center rounded-full bg-success/10 ring-4 ring-success/20"
      >
        <Check className="size-7 text-success" strokeWidth={3} />
      </motion.div>
      <h2 className="text-3xl md:text-4xl font-semibold tracking-tighter text-text-primary">
        You're in, {name}.
      </h2>
      <p className="mt-2 text-base text-text-secondary">
        Position{" "}
        <span className="font-mono text-text-primary">
          #{position.toLocaleString()}
        </span>
      </p>

      <div className="mt-8 rounded-card border border-border bg-card p-5 text-left">
        <p className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
          Your referral link
        </p>
        <div className="mt-3 flex items-center gap-2 rounded-button border border-border bg-surface px-3 py-2">
          <code className="flex-1 truncate font-mono text-[13px] text-accent">
            {referralLink}
          </code>
          <button
            type="button"
            onClick={handleCopy}
            className={cn(
              "shrink-0 rounded-badge border border-border px-2.5 py-1 text-xs transition-colors hover:border-border-hover",
              copied ? "text-success" : "text-text-secondary",
            )}
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <p className="mt-3 text-xs text-text-muted">
          Share it. Each person who joins moves you up.
        </p>
      </div>

      <div className="mt-6 flex items-center justify-center gap-4 text-sm">
        <a
          href="/dashboard"
          className="text-accent transition-colors hover:text-accent-hover"
        >
          Go to dashboard →
        </a>
        <span className="text-border">|</span>
        <a
          href="/leaderboard"
          className="text-text-secondary transition-colors hover:text-text-primary"
        >
          Leaderboard
        </a>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  Auth gate / Already-on
// ─────────────────────────────────────────────────────────────────

function CenteredCard({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-65px)] items-center justify-center px-6 py-16">
      <div className="w-full max-w-md text-center">{children}</div>
    </div>
  );
}

function SignInGate({ returnUrl }: { returnUrl: string }) {
  return (
    <CenteredCard>
      <p className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
        Waitlist
      </p>
      <h1 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tighter text-text-primary">
        Sign in to join.
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-text-secondary">
        We use your account to track your position and referrals. Quick sign-in
        with Google or GitHub.
      </p>
      <div className="mt-8">
        <SignInButton
          mode="modal"
          forceRedirectUrl={returnUrl}
          signUpForceRedirectUrl={returnUrl}
        >
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center rounded-button bg-gradient-to-b from-[#F59E0B] to-[#D97706] px-7 text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] ring-1 ring-[#D97706] transition-all hover:from-[#FBBF24] hover:to-[#F59E0B] active:translate-y-px"
          >
            Sign in to continue
          </button>
        </SignInButton>
      </div>
    </CenteredCard>
  );
}

function AlreadyOnWaitlist({ name, email }: { name: string; email: string }) {
  const position = useQuery(api.waitlist.getPosition, { email });
  const referrals = useQuery(api.waitlist.getReferrals, { email });

  if (position === undefined || referrals === undefined) {
    return (
      <CenteredCard>
        <p className="text-sm text-text-muted">Loading…</p>
      </CenteredCard>
    );
  }

  return (
    <CenteredCard>
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 18 }}
        className="mx-auto mb-6 flex size-14 items-center justify-center rounded-full bg-success/10 ring-4 ring-success/20"
      >
        <Check className="size-7 text-success" strokeWidth={3} />
      </motion.div>
      <h2 className="text-3xl md:text-4xl font-semibold tracking-tighter text-text-primary">
        You're already on the list, {name}.
      </h2>
      <p className="mt-2 text-base text-text-secondary">
        Position{" "}
        <span className="font-mono text-text-primary">
          #{position?.position ?? "·"}
        </span>
      </p>
      <div className="mt-6 flex items-center justify-center gap-3">
        <a
          href="/dashboard"
          className="inline-flex h-10 items-center justify-center rounded-button bg-gradient-to-b from-[#F59E0B] to-[#D97706] px-5 text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] ring-1 ring-[#D97706] transition-all hover:from-[#FBBF24] hover:to-[#F59E0B]"
        >
          Go to dashboard
        </a>
        <a
          href="/leaderboard"
          className="inline-flex h-10 items-center justify-center rounded-button border border-border bg-transparent px-5 text-sm text-text-primary transition-colors hover:bg-surface hover:border-border-hover"
        >
          Leaderboard
        </a>
      </div>
    </CenteredCard>
  );
}

// ─────────────────────────────────────────────────────────────────
//  Main wizard
// ─────────────────────────────────────────────────────────────────

export function WaitlistWizard({
  referralCode: refCode,
  returnUrl = "/waitlist",
}: WaitlistWizardProps) {
  const { user, isLoaded } = useUser();
  const userName = user?.fullName ?? user?.firstName ?? "";
  const userEmail = user?.primaryEmailAddress?.emailAddress ?? "";
  const submitWaitlist = useMutation(api.waitlist.submitWaitlist);
  const existingEntry = useQuery(
    api.waitlist.getPosition,
    userEmail ? { email: userEmail } : "skip",
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [position, setPosition] = useState(0);
  const [submitError, setSubmitError] = useState("");

  const [formData, setFormData] = useState<FormData>({
    role: "",
    interests: [],
    reason: "",
  });

  const updateField = useCallback(
    <K extends keyof FormData>(field: K, value: FormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const toggleInterest = useCallback((interest: string) => {
    setFormData((prev) => {
      const exists = prev.interests.includes(interest);
      const updated = exists
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest];
      return { ...prev, interests: updated };
    });
  }, []);

  const canContinue = useCallback((): boolean => {
    switch (currentStep) {
      case 0:
        return formData.role.length > 0;
      case 1:
        return formData.interests.length > 0;
      case 2:
        return formData.reason.trim().length >= MIN_REASON_CHARS;
      default:
        return false;
    }
  }, [currentStep, formData]);

  const handleContinue = useCallback(() => {
    if (!canContinue()) return;

    if (currentStep === 2) {
      setIsSubmitting(true);
      setSubmitError("");
      submitWaitlist({
        name: userName,
        email: userEmail,
        role: formData.role,
        reason: formData.reason,
        interests: formData.interests,
        referredBy: refCode || undefined,
        imageUrl: user?.imageUrl || undefined,
      })
        .then((result) => {
          setIsSubmitting(false);
          setGeneratedCode(result.referralCode);
          setPosition(result.position);
          try {
            localStorage.removeItem(REF_KEY);
          } catch {
            /* ignore */
          }
          setCurrentStep(3);
        })
        .catch((error) => {
          setIsSubmitting(false);
          setSubmitError(
            error instanceof Error
              ? error.message
              : "Something went wrong. Please try again.",
          );
        });
      return;
    }

    setCurrentStep((s) => s + 1);
  }, [
    currentStep,
    canContinue,
    formData,
    userName,
    userEmail,
    refCode,
    submitWaitlist,
    user?.imageUrl,
  ]);

  const handleBack = useCallback(() => {
    setCurrentStep((s) => Math.max(0, s - 1));
  }, []);

  // Keyboard: number keys for role, enter to continue (not in textarea)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inField =
        target?.tagName === "TEXTAREA" || target?.tagName === "INPUT";

      if (currentStep === 0 && !inField) {
        const idx = ["1", "2", "3"].indexOf(e.key);
        if (idx >= 0 && idx < ROLE_OPTIONS.length) {
          e.preventDefault();
          updateField("role", ROLE_OPTIONS[idx].value);
          return;
        }
      }

      if (
        e.key === "Enter" &&
        canContinue() &&
        !isSubmitting &&
        currentStep < TOTAL_STEPS
      ) {
        if (inField && !(e.metaKey || e.ctrlKey)) return;
        e.preventDefault();
        handleContinue();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canContinue, handleContinue, isSubmitting, currentStep, updateField]);

  // Loading
  if (!isLoaded) {
    return (
      <CenteredCard>
        <p className="text-sm text-text-muted">Loading…</p>
      </CenteredCard>
    );
  }
  if (!user) return <SignInGate returnUrl={returnUrl} />;
  if (existingEntry === undefined && currentStep < 3) {
    return (
      <CenteredCard>
        <p className="text-sm text-text-muted">Checking your status…</p>
      </CenteredCard>
    );
  }
  if (existingEntry !== null && currentStep < 3) {
    return (
      <AlreadyOnWaitlist
        name={userName.split(" ")[0] || "there"}
        email={userEmail}
      />
    );
  }

  // Success
  if (currentStep === 3) {
    return (
      <div className="flex min-h-[calc(100vh-65px)] items-center justify-center px-6 py-16">
        <SuccessScreen
          name={userName.split(" ")[0] || "there"}
          referralCode={generatedCode}
          position={position}
        />
      </div>
    );
  }

  // Wizard  full-screen split
  return (
    <div className="grid min-h-[calc(100vh-65px)] grid-cols-1 lg:grid-cols-[minmax(280px,360px)_1fr]">
      <WizardSidebar
        step={currentStep}
        interestsCount={formData.interests.length}
      />

      <section className="relative flex flex-col px-6 py-10 lg:px-14 lg:py-16">
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 24, filter: "blur(6px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: -24, filter: "blur(6px)" }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {currentStep === 0 && (
                <RoleStep
                  name={userName.split(" ")[0] || "there"}
                  value={formData.role}
                  onChange={(v) => updateField("role", v)}
                />
              )}
              {currentStep === 1 && (
                <InterestsStep
                  selected={formData.interests}
                  onToggle={toggleInterest}
                />
              )}
              {currentStep === 2 && (
                <ReasonStep
                  value={formData.reason}
                  onChange={(v) => updateField("reason", v)}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-10 space-y-3">
          {submitError && (
            <p className="text-sm text-destructive">{submitError}</p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <PrimaryButton
                disabled={!canContinue()}
                loading={isSubmitting}
                onClick={handleContinue}
              >
                {currentStep === 2 ? "Join the Waitlist" : "Continue"}
              </PrimaryButton>
              {currentStep > 0 && (
                <SecondaryButton onClick={handleBack}>Back</SecondaryButton>
              )}
            </div>
            <KeyboardHint>
              {currentStep === 0 ? (
                <>
                  <Kbd>1</Kbd>
                  <Kbd>2</Kbd>
                  <Kbd>3</Kbd>
                  to pick · <Kbd>↵</Kbd> to continue
                </>
              ) : (
                <>
                  <Kbd>
                    <CornerDownLeft className="size-2.5" />
                  </Kbd>
                  to continue
                </>
              )}
            </KeyboardHint>
          </div>
        </div>
      </section>
    </div>
  );
}
