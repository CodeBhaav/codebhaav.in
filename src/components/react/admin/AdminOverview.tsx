import { useId } from "react";
import { useUser } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../../../../convex/_generated/api";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  submitted: "#52525b",
  in_review: "#f59e0b",
  accepted: "#10b981",
  rejected: "#f43f5e",
};

const STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  in_review: "In review",
  accepted: "Accepted",
  rejected: "Rejected",
};

export function AdminOverview() {
  const { user } = useUser();
  const overview = useQuery(api.admin.getOverview, user ? {} : "skip");

  if (!user || !overview) {
    return <LoadingState />;
  }

  const statusData = overview.statusBreakdown
    .filter((s) => s.count > 0)
    .map((s) => ({
      name: STATUS_LABELS[s.name] ?? s.name,
      value: s.count,
      fill: STATUS_COLORS[s.name] ?? "#52525b",
    }));

  const waitlistTrend = overview.signupsByDay.map((d) => d.Waitlist);
  const foundingTrend = overview.signupsByDay.map(
    (d) => d["Founding applications"],
  );

  const waitlistDelta = computeDelta7v7(waitlistTrend);
  const foundingDelta = computeDelta7v7(foundingTrend);

  const totalApps = overview.statusBreakdown.reduce((s, x) => s + x.count, 0);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin"
        title="Overview"
        subtitle="Aggregate signups and applications across the past 30 days."
      />

      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Waitlist signups"
          value={overview.waitlistCount}
          delta={waitlistDelta}
          sparkline={waitlistTrend}
          sparklineColor="#f59e0b"
        />
        <MetricCard
          label="Founding applications"
          value={overview.foundingCount}
          delta={foundingDelta}
          sparkline={foundingTrend}
          sparklineColor="#fbbf24"
        />
        <MetricCard
          label="Pending review"
          value={overview.submittedCount}
          tone={overview.submittedCount > 0 ? "amber" : "neutral"}
          hint={
            overview.submittedCount > 0 ? "needs attention" : "all caught up"
          }
        />
        <MetricCard
          label="Conversion"
          value={`${overview.conversionRate}%`}
          hint="apps / signups"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHeader
            title="Signups over time"
            subtitle="Last 30 days · daily counts"
          />
          <div className="mt-6 h-72 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={overview.signupsByDay}
                margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="waitlistFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="foundingFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#fbbf24" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="#1F1F23"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  stroke="#52525b"
                  fontSize={11}
                  tickFormatter={formatDayShort}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={24}
                />
                <YAxis
                  stroke="#52525b"
                  fontSize={11}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  width={32}
                />
                <Tooltip
                  content={<ChartTooltip labelFormatter={formatDayLong} />}
                  cursor={{
                    stroke: "#2f2f35",
                    strokeWidth: 1,
                    strokeDasharray: "3 3",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="Waitlist"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fill="url(#waitlistFill)"
                  activeDot={{ r: 4, strokeWidth: 0, fill: "#f59e0b" }}
                />
                <Area
                  type="monotone"
                  dataKey="Founding applications"
                  stroke="#fbbf24"
                  strokeWidth={2}
                  fill="url(#foundingFill)"
                  activeDot={{ r: 4, strokeWidth: 0, fill: "#fbbf24" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <LegendRow
            items={[
              { label: "Waitlist", color: "#f59e0b" },
              { label: "Founding applications", color: "#fbbf24" },
            ]}
          />
        </Panel>

        <Panel>
          <PanelHeader title="Applications by status" subtitle="All-time" />
          {statusData.length === 0 ? (
            <EmptyState message="No applications yet." className="mt-6" />
          ) : (
            <>
              <div className="mt-4 flex items-center justify-center">
                <div className="relative h-[180px] w-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={56}
                        outerRadius={84}
                        paddingAngle={statusData.length > 1 ? 2 : 0}
                        strokeWidth={0}
                      >
                        {statusData.map((entry) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold tabular-nums text-text-primary">
                      {totalApps}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
                      total
                    </span>
                  </div>
                </div>
              </div>
              <LegendRow
                items={statusData.map((s) => ({
                  label: `${s.name} · ${s.value}`,
                  color: s.fill,
                }))}
              />
            </>
          )}
        </Panel>
      </div>

      <Panel padded={false}>
        <div className="flex items-center justify-between gap-3 px-6 py-5">
          <PanelHeader
            title="Latest applications"
            subtitle="Most recent founding-member submissions"
            inline
          />
          <a
            href="/admin/founding-members"
            className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-accent transition-colors hover:text-accent-hover"
          >
            View all <span aria-hidden>→</span>
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-y border-border bg-surface/40 text-left font-mono text-[10px] uppercase tracking-widest text-text-muted">
                <th className="px-6 py-2.5 font-medium">Applicant</th>
                <th className="px-6 py-2.5 font-medium">Email</th>
                <th className="px-6 py-2.5 font-medium">Submitted</th>
                <th className="px-6 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {overview.recentApplications.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-10 text-center text-sm text-text-muted"
                  >
                    No applications yet.
                  </td>
                </tr>
              ) : (
                overview.recentApplications.map((app) => (
                  <tr
                    key={app.id}
                    className="border-b border-border last:border-b-0 transition-colors hover:bg-surface/40"
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={app.name} />
                        <span className="font-medium text-text-primary">
                          {app.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 truncate max-w-[260px] text-text-secondary">
                      {app.email}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-[12px] text-text-muted whitespace-nowrap">
                      {formatRelative(app.submittedAt)}
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusPill status={app.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border px-6 py-3 text-right sm:hidden">
          <a
            href="/admin/founding-members"
            className="text-xs font-medium text-accent hover:text-accent-hover"
          >
            View all applications →
          </a>
        </div>
      </Panel>
    </div>
  );
}

/* ─── Shared primitives (exported for other admin pages) ──────────────── */

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && (
          <p className="font-mono text-[11px] uppercase tracking-widest text-text-muted">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 text-sm text-text-secondary max-w-xl">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Panel({
  children,
  className,
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-card border border-border bg-card overflow-hidden",
        padded && "p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PanelHeader({
  title,
  subtitle,
  hint,
  inline,
  cta,
}: {
  title: string;
  subtitle?: string;
  hint?: string;
  inline?: boolean;
  cta?: React.ReactNode;
}) {
  // `hint` kept as an alias for `subtitle` for backwards-compat
  const sub = subtitle ?? hint;
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3",
        !inline && "mb-1",
      )}
    >
      <div className="min-w-0">
        <h2 className="text-base font-semibold tracking-tight text-text-primary">
          {title}
        </h2>
        {sub && <p className="mt-0.5 text-xs text-text-muted">{sub}</p>}
      </div>
      {cta && <div className="shrink-0">{cta}</div>}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  hint,
  tone = "neutral",
  delta,
  sparkline,
  sparklineColor = "#f59e0b",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "neutral" | "amber" | "success";
  delta?: number | null;
  sparkline?: number[];
  sparklineColor?: string;
}) {
  const valueClass =
    tone === "amber"
      ? "text-accent"
      : tone === "success"
        ? "text-emerald-400"
        : "text-text-primary";
  const hasSpark = sparkline && sparkline.length >= 2;
  return (
    <div className="group rounded-card border border-border bg-card p-4 sm:p-5 transition-colors hover:border-border-hover">
      <div className="flex items-start justify-between gap-2">
        <p className="font-mono text-[10px] sm:text-[11px] uppercase tracking-widest text-text-muted">
          {label}
        </p>
        {delta !== undefined && delta !== null && <TrendBadge value={delta} />}
      </div>
      <p
        className={cn(
          "mt-3 text-2xl sm:text-3xl font-bold tracking-tight tabular-nums truncate",
          valueClass,
        )}
        title={typeof value === "string" ? value : undefined}
      >
        {value}
      </p>
      <div className="mt-3 flex items-end justify-between gap-3 min-h-[20px]">
        {hint ? (
          <p className="text-[11px] text-text-muted truncate">{hint}</p>
        ) : (
          <span />
        )}
        {hasSpark && (
          <Sparkline
            data={sparkline}
            color={sparklineColor}
            className="opacity-80 transition-opacity group-hover:opacity-100"
          />
        )}
      </div>
    </div>
  );
}

export function Sparkline({
  data,
  color = "#f59e0b",
  width = 72,
  height = 22,
  className,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  className?: string;
}) {
  const reactId = useId();
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const stepX = data.length > 1 ? width / (data.length - 1) : 0;
  const points = data
    .map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  const areaPoints = `0,${height} ${points} ${width},${height}`;
  const gradientId = `spark-${reactId.replace(/:/g, "")}`;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn("shrink-0 overflow-visible", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#${gradientId})`} />
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export function TrendBadge({ value }: { value: number | null }) {
  if (value === null || Number.isNaN(value)) return null;
  const positive = value > 0;
  const negative = value < 0;
  const color = positive
    ? "text-emerald-400 bg-emerald-500/10"
    : negative
      ? "text-rose-400 bg-rose-500/10"
      : "text-text-muted bg-surface";
  const arrow = positive ? "↑" : negative ? "↓" : "·";
  const display = `${positive ? "+" : ""}${value.toFixed(1)}%`;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[4px] px-1.5 py-0.5 font-mono text-[10px] tabular-nums leading-none",
        color,
      )}
    >
      <span aria-hidden>{arrow}</span>
      <span>{display}</span>
    </span>
  );
}

export function ChartTooltip({
  active,
  payload,
  label,
  labelFormatter,
}: {
  active?: boolean;
  payload?: Array<{
    dataKey?: string | number;
    name?: string;
    value?: number;
    color?: string;
    payload?: { fill?: string };
  }>;
  label?: string | number;
  labelFormatter?: (label: string | number) => string;
}) {
  if (!active || !payload?.length) return null;
  const formatted =
    label !== undefined && labelFormatter
      ? labelFormatter(label)
      : label !== undefined
        ? String(label)
        : null;
  return (
    <div className="rounded-[6px] border border-border bg-card/95 px-3 py-2 shadow-lg backdrop-blur-sm">
      {formatted && (
        <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
          {formatted}
        </p>
      )}
      <div className={cn("space-y-1", formatted && "mt-1.5")}>
        {payload.map((entry, i) => (
          <div
            key={`${entry.dataKey ?? entry.name ?? i}`}
            className="flex items-center justify-between gap-4 text-xs"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{
                  background:
                    entry.color ?? entry.payload?.fill ?? "#52525b",
                }}
              />
              <span className="truncate text-text-secondary">{entry.name}</span>
            </div>
            <span className="font-mono tabular-nums text-text-primary">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LegendRow({
  items,
}: {
  items: Array<{ label: string; color: string }>;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-2 text-xs text-text-secondary"
        >
          <span
            className="size-2 rounded-full"
            style={{ background: item.color }}
          />
          {item.label}
        </div>
      ))}
    </div>
  );
}

export function StatusPill({
  status,
  size = "sm",
}: {
  status: "submitted" | "in_review" | "accepted" | "rejected";
  size?: "sm" | "md";
}) {
  const config = {
    submitted: {
      label: "Submitted",
      classes: "border-border bg-surface text-text-secondary",
      dot: "#71717a",
    },
    in_review: {
      label: "In review",
      classes: "border-amber-500/40 bg-amber-500/10 text-amber-300",
      dot: "#f59e0b",
    },
    accepted: {
      label: "Accepted",
      classes: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
      dot: "#10b981",
    },
    rejected: {
      label: "Rejected",
      classes: "border-rose-500/40 bg-rose-500/10 text-rose-300",
      dot: "#f43f5e",
    },
  }[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[4px] border font-mono uppercase tracking-wider",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]",
        config.classes,
      )}
    >
      <span
        className="size-1.5 rounded-full"
        style={{ background: config.dot }}
        aria-hidden
      />
      {config.label}
    </span>
  );
}

export function Avatar({
  name,
  size = 32,
}: {
  name: string;
  size?: number;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
  // Stable hue from name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full border border-border font-mono text-[11px] font-medium text-text-primary"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, hsl(${hue} 30% 18%), hsl(${(hue + 30) % 360} 35% 12%))`,
      }}
    >
      {initials || "·"}
    </span>
  );
}

export function EmptyState({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-[6px] border border-dashed border-border bg-background/40 px-6 py-10",
        className,
      )}
    >
      <span
        className="font-mono text-base text-text-muted"
        aria-hidden
      >
        ◌
      </span>
      <p className="text-sm text-text-muted">{message}</p>
    </div>
  );
}

/* ─── Helpers ──────────────────────────────────────────────────────────── */

export function computeDelta7v7(series: number[]): number | null {
  if (series.length < 14) return null;
  const last7 = series.slice(-7).reduce((a, b) => a + b, 0);
  const prev7 = series.slice(-14, -7).reduce((a, b) => a + b, 0);
  return computePctDelta(last7, prev7);
}

export function computePctDelta(curr: number, prev: number): number | null {
  if (prev === 0) {
    if (curr === 0) return 0;
    return null; // can't show meaningful % when prior period is zero
  }
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}

export function formatDayShort(d: string): string {
  // d = YYYY-MM-DD
  if (!d || d.length < 10) return d;
  const date = new Date(`${d}T00:00:00Z`);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function formatDayLong(d: string | number): string {
  if (typeof d !== "string") return String(d);
  const date = new Date(`${d}T00:00:00Z`);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function formatRelative(ms: number): string {
  const diff = Date.now() - ms;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(ms).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function LoadingState() {
  return (
    <div className="space-y-8">
      <div>
        <div className="h-3 w-16 animate-pulse rounded-[4px] bg-surface" />
        <div className="mt-3 h-9 w-56 animate-pulse rounded-[4px] bg-surface" />
        <div className="mt-2 h-3 w-72 animate-pulse rounded-[4px] bg-surface/60" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-[120px] animate-pulse rounded-card bg-surface" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 h-80 animate-pulse rounded-card bg-surface" />
        <div className="h-80 animate-pulse rounded-card bg-surface" />
      </div>
      <div className="h-64 animate-pulse rounded-card bg-surface" />
    </div>
  );
}
