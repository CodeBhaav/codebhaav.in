import { useUser } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import {
	AreaChart,
	Card,
	DonutChart,
	Legend,
	Title,
} from "@tremor/react";
import { api } from "../../../../convex/_generated/api";

const STATUS_LABELS: Record<string, string> = {
	submitted: "Submitted",
	in_review: "In review",
	accepted: "Accepted",
	rejected: "Rejected",
};

export function AdminOverview() {
	const { user } = useUser();
	const overview = useQuery(
		api.admin.getOverview,
		user ? {} : "skip",
	);

	if (!user || !overview) {
		return <LoadingState />;
	}

	const statusData = overview.statusBreakdown.map((s) => ({
		name: STATUS_LABELS[s.name] ?? s.name,
		count: s.count,
	}));

	return (
		<div>
			<header className="mb-8">
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
				<MetricCard
					label="Waitlist signups"
					value={overview.waitlistCount}
				/>
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

			<div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
				<Card className="lg:col-span-2 bg-surface border-border">
					<Title className="text-text-primary">
						Signups over time
					</Title>
					<p className="mt-1 text-xs text-text-muted">
						Last 30 days · Daily counts
					</p>
					<AreaChart
						className="mt-4 h-72"
						data={overview.signupsByDay}
						index="day"
						categories={["Waitlist", "Founding applications"]}
						colors={["amber", "yellow"]}
						showLegend
						showGridLines
						showAnimation
						valueFormatter={(v) => v.toString()}
					/>
				</Card>

				<Card className="bg-surface border-border">
					<Title className="text-text-primary">
						Applications by status
					</Title>
					<p className="mt-1 text-xs text-text-muted">
						All-time
					</p>
					<DonutChart
						className="mt-6 h-44"
						data={statusData}
						category="count"
						index="name"
						colors={["slate", "amber", "emerald", "rose"]}
						showAnimation
						valueFormatter={(v) => v.toString()}
					/>
					<Legend
						className="mt-4"
						categories={statusData.map((d) => d.name)}
						colors={["slate", "amber", "emerald", "rose"]}
					/>
				</Card>
			</div>

			<div className="mt-6">
				<Card className="bg-surface border-border">
					<Title className="text-text-primary">
						Latest applications
					</Title>
					<p className="mt-1 text-xs text-text-muted">
						Most recent founding-member submissions
					</p>
					<div className="mt-4 overflow-x-auto">
						<table className="min-w-full text-sm">
							<thead>
								<tr className="text-left font-mono text-[11px] uppercase tracking-wider text-text-muted">
									<th className="py-2 pr-4 font-medium">Name</th>
									<th className="py-2 pr-4 font-medium">Email</th>
									<th className="py-2 pr-4 font-medium">Submitted</th>
									<th className="py-2 font-medium">Status</th>
								</tr>
							</thead>
							<tbody>
								{overview.recentApplications.length === 0 ? (
									<tr>
										<td
											colSpan={4}
											className="py-6 text-center text-sm text-text-muted"
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
											<td className="py-3 pr-4 text-text-primary font-medium">
												{app.name}
											</td>
											<td className="py-3 pr-4 truncate max-w-[260px]">
												{app.email}
											</td>
											<td className="py-3 pr-4 font-mono text-[12px] text-text-muted">
												{new Date(app.submittedAt).toLocaleDateString()}
											</td>
											<td className="py-3">
												<StatusPill status={app.status} />
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
					<div className="mt-4 text-right">
						<a
							href="/admin/founding-members"
							className="text-xs font-medium text-accent hover:text-accent-hover"
						>
							View all applications →
						</a>
					</div>
				</Card>
			</div>
		</div>
	);
}

function MetricCard({
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
	const valueClass =
		tone === "amber" ? "text-accent" : "text-text-primary";
	return (
		<Card className="bg-surface border-border">
			<p className="font-mono text-[10px] sm:text-[11px] uppercase tracking-widest text-text-muted">
				{label}
			</p>
			<p
				className={`mt-2 text-2xl sm:text-3xl font-bold tracking-tight ${valueClass}`}
			>
				{value}
			</p>
			{hint && (
				<p className="mt-1 text-[11px] text-text-muted">{hint}</p>
			)}
		</Card>
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
			classes: "border-amber/40 bg-[#241906] text-amber",
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
		<div>
			<div className="h-6 w-40 animate-pulse rounded-[4px] bg-surface mb-2" />
			<div className="h-9 w-56 animate-pulse rounded-[4px] bg-surface" />
			<div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
				{[1, 2, 3, 4].map((i) => (
					<div
						key={i}
						className="h-24 animate-pulse rounded-card bg-surface"
					/>
				))}
			</div>
			<div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
				<div className="lg:col-span-2 h-80 animate-pulse rounded-card bg-surface" />
				<div className="h-80 animate-pulse rounded-card bg-surface" />
			</div>
		</div>
	);
}
