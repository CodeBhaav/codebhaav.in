import { useMemo, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { ChevronRight } from "lucide-react";
import {
	Cell,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
} from "recharts";
import { api } from "../../../../convex/_generated/api";
import { cn } from "@/lib/utils";
import {
	Avatar,
	ChartTooltip,
	EmptyState,
	LegendRow,
	MetricCard,
	PageHeader,
	Panel,
	PanelHeader,
	StatusPill,
	computePctDelta,
	formatRelative,
} from "./AdminOverview";

type ApplicationStatus = "submitted" | "in_review" | "accepted" | "rejected";

const STATUS_LABELS: Record<ApplicationStatus, string> = {
	submitted: "Submitted",
	in_review: "In review",
	accepted: "Accepted",
	rejected: "Rejected",
};

const STATUS_COLORS: Record<ApplicationStatus, string> = {
	submitted: "#52525b",
	in_review: "#f59e0b",
	accepted: "#10b981",
	rejected: "#f43f5e",
};

const STATUS_FILTERS: Array<{ key: ApplicationStatus | "all"; label: string }> = [
	{ key: "all", label: "All" },
	{ key: "submitted", label: "Submitted" },
	{ key: "in_review", label: "In review" },
	{ key: "accepted", label: "Accepted" },
	{ key: "rejected", label: "Rejected" },
];

export function FoundingMembersPanel() {
	const { user } = useUser();

	const stats = useQuery(api.admin.getFoundingStats, user ? {} : "skip");
	const list = useQuery(api.admin.listFoundingMembers, user ? {} : "skip");

	const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">(
		"all",
	);
	const [search, setSearch] = useState("");

	const filtered = useMemo(() => {
		if (!list) return [];
		const q = search.trim().toLowerCase();
		return list.filter((app) => {
			if (statusFilter !== "all" && app.status !== statusFilter) return false;
			if (!q) return true;
			return (
				app.name.toLowerCase().includes(q) ||
				app.email.toLowerCase().includes(q)
			);
		});
	}, [list, statusFilter, search]);

	if (!user || !stats || !list) {
		return <LoadingState />;
	}

	const statusData = stats.byStatus
		.filter((s) => s.count > 0)
		.map((s) => ({
			name: STATUS_LABELS[s.name as ApplicationStatus] ?? s.name,
			value: s.count,
			fill: STATUS_COLORS[s.name as ApplicationStatus] ?? "#52525b",
		}));

	const trendValues = stats.applicationsByDay.map((d) => d.count);
	const weekDelta = computePctDelta(stats.thisWeekCount, stats.prevWeekCount);

	const acceptanceRate =
		stats.total > 0
			? Math.round((stats.acceptedCount / stats.total) * 1000) / 10
			: 0;

	return (
		<div className="space-y-8">
			<PageHeader
				eyebrow="Admin"
				title="Founding Members"
				subtitle="Review applications and flip status inline. Status changes fire the corresponding email automatically."
			/>

			<div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
				<MetricCard
					label="Total"
					value={stats.total}
					sparkline={trendValues}
					delta={weekDelta}
				/>
				<MetricCard
					label="Pending review"
					value={stats.submittedCount}
					tone={stats.submittedCount > 0 ? "amber" : "neutral"}
					hint={
						stats.submittedCount > 0
							? "needs attention"
							: "all caught up"
					}
				/>
				<MetricCard
					label="Accepted"
					value={stats.acceptedCount}
					tone="success"
					hint={`${acceptanceRate}% acceptance`}
				/>
				<MetricCard label="Rejected" value={stats.rejectedCount} />
			</div>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
				<Panel className="lg:col-span-1">
					<PanelHeader title="Status breakdown" subtitle="All-time" />
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
											{stats.total}
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

				<Panel className="lg:col-span-2">
					<PanelHeader title="Pipeline guide" subtitle="What each status means" />
					<ul className="mt-5 space-y-3 text-xs text-text-secondary">
						<li className="flex items-start gap-3">
							<span className="shrink-0">
								<StatusPill status="submitted" />
							</span>
							<span className="leading-relaxed text-text-muted">
								Initial state. Applicant can still edit their submission until
								you flip this.
							</span>
						</li>
						<li className="flex items-start gap-3">
							<span className="shrink-0">
								<StatusPill status="in_review" />
							</span>
							<span className="leading-relaxed text-text-muted">
								You're actively reviewing. No email sent. Edits locked for the
								applicant.
							</span>
						</li>
						<li className="flex items-start gap-3">
							<span className="shrink-0">
								<StatusPill status="accepted" />
							</span>
							<span className="leading-relaxed text-text-muted">
								Sends the acceptance email with dashboard CTA.
							</span>
						</li>
						<li className="flex items-start gap-3">
							<span className="shrink-0">
								<StatusPill status="rejected" />
							</span>
							<span className="leading-relaxed text-text-muted">
								Sends the rejection email reaffirming waitlist place.
							</span>
						</li>
					</ul>
				</Panel>
			</div>

			<Panel padded={false}>
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-5">
					<PanelHeader
						title="All applications"
						subtitle={`${filtered.length} of ${list.length} ${list.length === 1 ? "row" : "rows"} · click to open`}
						inline
					/>
					<div className="flex flex-wrap items-center gap-2">
						<input
							type="search"
							placeholder="Search name or email…"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="h-9 w-56 rounded-button border border-border bg-surface px-3 text-xs text-text-primary placeholder:text-text-muted transition-colors hover:border-border-hover focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
						/>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-1 border-b border-border px-4 py-3 sm:px-6">
					{STATUS_FILTERS.map((f) => {
						const count =
							f.key === "all"
								? stats.total
								: f.key === "submitted"
									? stats.submittedCount
									: f.key === "in_review"
										? stats.inReviewCount
										: f.key === "accepted"
											? stats.acceptedCount
											: stats.rejectedCount;
						const active = statusFilter === f.key;
						return (
							<button
								key={f.key}
								type="button"
								onClick={() => setStatusFilter(f.key)}
								className={cn(
									"inline-flex items-center gap-1.5 rounded-button px-3 py-1.5 text-xs font-medium transition-colors",
									active
										? "bg-accent/10 text-accent"
										: "text-text-secondary hover:bg-surface hover:text-text-primary",
								)}
							>
								{f.label}
								<span
									className={cn(
										"rounded-[3px] px-1 font-mono text-[10px] tabular-nums",
										active
											? "bg-accent/20 text-accent"
											: "bg-surface text-text-muted",
									)}
								>
									{count}
								</span>
							</button>
						);
					})}
				</div>

				<div className="divide-y divide-border">
					{filtered.length === 0 ? (
						<div className="px-6 py-12">
							<EmptyState
								message={
									list.length === 0
										? "No applications yet."
										: "No matches for the current filter."
								}
							/>
						</div>
					) : (
						filtered.map((app) => (
							<a
								key={app.id}
								href={`/admin/founding-members/${app.id}`}
								className="group flex flex-wrap items-center gap-4 px-6 py-4 transition-colors hover:bg-surface/40 focus-visible:bg-surface/40 focus-visible:outline-none"
							>
								<Avatar name={app.name} size={36} />
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium text-text-primary truncate">
										{app.name}
									</p>
									<p className="text-xs text-text-muted truncate">
										{app.email}
									</p>
								</div>
								<p className="hidden sm:block font-mono text-[11px] text-text-muted whitespace-nowrap">
									{formatRelative(app.submittedAt)}
								</p>
								<StatusPill status={app.status} />
								<ChevronRight
									className="size-4 text-text-muted transition-all group-hover:translate-x-0.5 group-hover:text-text-primary"
									aria-hidden
								/>
							</a>
						))
					)}
				</div>
			</Panel>
		</div>
	);
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
				<div className="h-72 animate-pulse rounded-card bg-surface" />
				<div className="lg:col-span-2 h-72 animate-pulse rounded-card bg-surface" />
			</div>
			<div className="h-64 animate-pulse rounded-card bg-surface" />
		</div>
	);
}
