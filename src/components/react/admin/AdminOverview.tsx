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

  return (
    <div className="space-y-6">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-widest text-text-muted">
          Admin
        </p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
          Overview
        </h1>
        <p className="mt-1.5 text-sm text-text-secondary">
          Aggregate signups and applications across the past 30 days.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <MetricCard label="Waitlist signups" value={overview.waitlistCount} />
        <MetricCard
          label="Founding applications"
          value={overview.foundingCount}
        />
        <MetricCard
          label="Pending review"
          value={overview.submittedCount}
          tone={overview.submittedCount > 0 ? "amber" : "neutral"}
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
            hint="Last 30 days · Daily counts"
          />
          <div className="mt-4 h-72 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={overview.signupsByDay}
                margin={{ top: 4, right: 12, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="waitlistFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="foundingFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.3} />
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
                  tickFormatter={(d: string) => d.slice(5)}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke="#52525b"
                  fontSize={11}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0a0a0a",
                    border: "1px solid #1F1F23",
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "#a1a1aa" }}
                  itemStyle={{ color: "#fafafa" }}
                />
                <Area
                  type="monotone"
                  dataKey="Waitlist"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fill="url(#waitlistFill)"
                />
                <Area
                  type="monotone"
                  dataKey="Founding applications"
                  stroke="#fbbf24"
                  strokeWidth={2}
                  fill="url(#foundingFill)"
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
          <PanelHeader title="Applications by status" hint="All-time" />
          {statusData.length === 0 ? (
            <p className="mt-8 py-12 text-center text-sm text-text-muted">
              No applications yet.
            </p>
          ) : (
            <>
              <div className="mt-4 h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {statusData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0a0a0a",
                        border: "1px solid #1F1F23",
                        borderRadius: 6,
                        fontSize: 12,
                      }}
                      labelStyle={{ color: "#a1a1aa" }}
                      itemStyle={{ color: "#fafafa" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <LegendRow
                items={statusData.map((s) => ({
                  label: `${s.name} (${s.value})`,
                  color: s.fill,
                }))}
              />
            </>
          )}
        </Panel>
      </div>

      <Panel>
        <PanelHeader
          title="Latest applications"
          hint="Most recent founding-member submissions"
        />
        <div className="mt-4 overflow-x-auto -mx-6">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left font-mono text-[11px] uppercase tracking-wider text-text-muted">
                <th className="px-6 py-2 font-medium">Name</th>
                <th className="px-6 py-2 font-medium">Email</th>
                <th className="px-6 py-2 font-medium">Submitted</th>
                <th className="px-6 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {overview.recentApplications.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-6 text-center text-sm text-text-muted"
                  >
                    No applications yet.
                  </td>
                </tr>
              ) : (
                overview.recentApplications.map((app) => (
                  <tr
                    key={app.id}
                    className="border-t border-border text-text-secondary"
                  >
                    <td className="px-6 py-3 text-text-primary font-medium">
                      {app.name}
                    </td>
                    <td className="px-6 py-3 truncate max-w-[260px]">
                      {app.email}
                    </td>
                    <td className="px-6 py-3 font-mono text-[12px] text-text-muted">
                      {new Date(app.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3">
                      <StatusPill status={app.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4 px-6 text-right">
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

export function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("rounded-card border border-border bg-card p-6", className)}
    >
      {children}
    </div>
  );
}

export function PanelHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-text-primary">{title}</h2>
      {hint && <p className="mt-1 text-xs text-text-muted">{hint}</p>}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "neutral" | "amber";
}) {
  const valueClass = tone === "amber" ? "text-accent" : "text-text-primary";
  return (
    <div className="rounded-card border border-border bg-card p-4 sm:p-5">
      <p className="font-mono text-[10px] sm:text-[11px] uppercase tracking-widest text-text-muted">
        {label}
      </p>
      <p
        className={`mt-2 text-2xl sm:text-3xl font-bold tracking-tight ${valueClass}`}
      >
        {value}
      </p>
      {hint && (
        <p className="mt-1 text-[11px] text-text-muted truncate">{hint}</p>
      )}
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
}: {
  status: "submitted" | "in_review" | "accepted" | "rejected";
}) {
  const config = {
    submitted: {
      label: "Submitted",
      classes: "border-border bg-card text-text-secondary",
    },
    in_review: {
      label: "In review",
      classes: "border-[#f59e0b]/40 bg-[#241906] text-accent",
    },
    accepted: {
      label: "Accepted",
      classes: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
    },
    rejected: {
      label: "Rejected",
      classes: "border-rose-500/40 bg-rose-500/10 text-rose-400",
    },
  }[status];

  return (
    <span
      className={`inline-flex items-center rounded-[4px] border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${config.classes}`}
    >
      {config.label}
    </span>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-4 w-20 animate-pulse rounded-[4px] bg-surface" />
        <div className="mt-3 h-9 w-56 animate-pulse rounded-[4px] bg-surface" />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-card bg-surface" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 h-80 animate-pulse rounded-card bg-surface" />
        <div className="h-80 animate-pulse rounded-card bg-surface" />
      </div>
    </div>
  );
}
