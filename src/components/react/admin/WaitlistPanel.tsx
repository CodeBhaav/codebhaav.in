import { useMemo, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import {
	Area,
	AreaChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { api } from "../../../../convex/_generated/api";
import { cn } from "@/lib/utils";
import {
	Avatar,
	ChartTooltip,
	EmptyState,
	MetricCard,
	PageHeader,
	Panel,
	PanelHeader,
	computePctDelta,
	formatDayLong,
	formatDayShort,
	formatRelative,
} from "./AdminOverview";

export function WaitlistPanel() {
	const { user } = useUser();

	const stats = useQuery(api.admin.getWaitlistStats, user ? {} : "skip");
	const list = useQuery(api.admin.listWaitlist, user ? {} : "skip");

	const [search, setSearch] = useState("");
	const [roleFilter, setRoleFilter] = useState<string | null>(null);

	const filtered = useMemo(() => {
		if (!list) return [];
		const q = search.trim().toLowerCase();
		return list.filter((row) => {
			if (roleFilter && row.role !== roleFilter) return false;
			if (!q) return true;
			return (
				row.name.toLowerCase().includes(q) ||
				row.email.toLowerCase().includes(q) ||
				row.referralCode.toLowerCase().includes(q) ||
				row.interests.some((i) => i.toLowerCase().includes(q))
			);
		});
	}, [list, search, roleFilter]);

	if (!user || !stats || !list) {
		return <LoadingState />;
	}

	const weekTrend = stats.signupsByDay.slice(-14).map((d) => d.count);
	const monthTrend = stats.signupsByDay.map((d) => d.count);
	const totalDelta = computePctDelta(stats.thisMonthCount, stats.prevMonthCount);
	const weekDelta = computePctDelta(stats.thisWeekCount, stats.prevWeekCount);
	const monthDelta = computePctDelta(stats.thisMonthCount, stats.prevMonthCount);

	const csvUrl = `data:text/csv;charset=utf-8,${encodeURIComponent(toCsv(list))}`;
	const csvFilename = `codebhaav-waitlist-${new Date().toISOString().slice(0, 10)}.csv`;

	return (
		<div className="space-y-8">
			<PageHeader
				eyebrow="Admin · Alpha"
				title="Waitlist"
				subtitle="Pre-launch signups. This view will be deprecated once the platform opens."
				actions={
					<a
						href={csvUrl}
						download={csvFilename}
						className="inline-flex h-9 items-center gap-2 rounded-button border border-border bg-surface px-3.5 text-xs font-medium text-text-secondary transition-colors hover:border-border-hover hover:bg-surface-hover hover:text-text-primary"
					>
						<span aria-hidden className="font-mono">↓</span>
						Export CSV
					</a>
				}
			/>

			<div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<MetricCard
					label="Total signups"
					value={stats.total}
					delta={totalDelta}
					sparkline={monthTrend}
				/>
				<MetricCard
					label="This week"
					value={stats.thisWeekCount}
					delta={weekDelta}
					sparkline={weekTrend}
					hint="vs prior 7 days"
				/>
				<MetricCard
					label="This month"
					value={stats.thisMonthCount}
					delta={monthDelta}
					sparkline={monthTrend}
					hint="vs prior 30 days"
				/>
				<MetricCard
					label="Top referrer"
					value={
						stats.topReferrer && stats.topReferrer.referralCount > 0
							? stats.topReferrer.name
							: "—"
					}
					hint={
						stats.topReferrer && stats.topReferrer.referralCount > 0
							? `${stats.topReferrer.referralCount} ${
									stats.topReferrer.referralCount === 1 ? "invite" : "invites"
								}`
							: "no referrals yet"
					}
				/>
			</div>

			<Panel>
				<PanelHeader title="Signups over time" subtitle="Last 30 days" />
				<div className="mt-6 h-64 -mx-2">
					<ResponsiveContainer width="100%" height="100%">
						<AreaChart
							data={stats.signupsByDay}
							margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
						>
							<defs>
								<linearGradient id="waitlistFill2" x1="0" y1="0" x2="0" y2="1">
									<stop offset="0%" stopColor="#f59e0b" stopOpacity={0.35} />
									<stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
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
								dataKey="count"
								name="Signups"
								stroke="#f59e0b"
								strokeWidth={2}
								fill="url(#waitlistFill2)"
								activeDot={{ r: 4, strokeWidth: 0, fill: "#f59e0b" }}
							/>
						</AreaChart>
					</ResponsiveContainer>
				</div>
			</Panel>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<Panel>
					<PanelHeader
						title="Interests"
						subtitle="Tags selected at signup"
					/>
					<BarList
						className="mt-5"
						data={stats.byInterest.map((b) => ({
							name: b.name,
							value: b.count,
						}))}
						total={stats.total}
					/>
				</Panel>

				<Panel>
					<PanelHeader title="Roles" subtitle="Self-described role" />
					<BarList
						className="mt-5"
						data={stats.byRole.map((b) => ({
							name: b.name,
							value: b.count,
						}))}
						total={stats.total}
					/>
				</Panel>
			</div>

			<Panel>
				<PanelHeader
					title="Top referrers"
					subtitle="Ranked by successful invites"
				/>
				{(() => {
					const realReferrers = stats.topReferrers.filter(
						(r) => r.referralCount > 0,
					);
					if (realReferrers.length === 0) {
						return (
							<EmptyState
								message="Nobody has referred anyone yet."
								className="mt-5"
							/>
						);
					}
					const max = realReferrers[0]?.referralCount ?? 1;
					return (
						<ul className="mt-5 space-y-2">
							{realReferrers.map((r, i) => {
								const pct = max === 0 ? 0 : (r.referralCount / max) * 100;
								const rank = i + 1;
								const medalColor =
									rank === 1
										? "text-amber-400"
										: rank === 2
											? "text-zinc-300"
											: rank === 3
												? "text-orange-400"
												: "text-text-muted";
								return (
									<li
										key={r.referralCode}
										className="group flex items-center gap-4 rounded-[6px] border border-transparent px-3 py-2.5 transition-colors hover:border-border hover:bg-surface/40"
									>
										<span
											className={cn(
												"w-6 shrink-0 font-mono text-[12px] font-medium tabular-nums",
												medalColor,
											)}
										>
											#{rank}
										</span>
										<Avatar name={r.name} size={28} />
										<div className="flex-1 min-w-0">
											<p className="truncate text-sm font-medium text-text-primary">
												{r.name}
											</p>
											<p className="font-mono text-[11px] text-accent">
												{r.referralCode}
											</p>
										</div>
										<div className="hidden sm:block w-32 shrink-0">
											<div className="h-1.5 w-full rounded-full bg-surface overflow-hidden">
												<div
													className="h-full rounded-full bg-accent/70 transition-all group-hover:bg-accent"
													style={{ width: `${pct}%` }}
												/>
											</div>
										</div>
										<span className="w-10 shrink-0 text-right font-mono text-sm tabular-nums text-text-primary">
											{r.referralCount}
										</span>
									</li>
								);
							})}
						</ul>
					);
				})()}
			</Panel>

			<Panel padded={false}>
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-5">
					<PanelHeader
						title="All signups"
						subtitle={`${filtered.length} of ${list.length} ${list.length === 1 ? "row" : "rows"} · sorted by most recent`}
						inline
					/>
					<div className="flex flex-wrap items-center gap-2">
						{stats.byRole.length > 0 && (
							<select
								value={roleFilter ?? ""}
								onChange={(e) => setRoleFilter(e.target.value || null)}
								className="h-9 rounded-button border border-border bg-surface px-3 text-xs text-text-secondary transition-colors hover:border-border-hover focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
							>
								<option value="">All roles</option>
								{stats.byRole.map((r) => (
									<option key={r.name} value={r.name}>
										{r.name} ({r.count})
									</option>
								))}
							</select>
						)}
						<input
							type="search"
							placeholder="Search name, email, code…"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="h-9 w-56 rounded-button border border-border bg-surface px-3 text-xs text-text-primary placeholder:text-text-muted transition-colors hover:border-border-hover focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
						/>
					</div>
				</div>
				<div className="overflow-x-auto">
					<table className="min-w-full text-sm">
						<thead>
							<tr className="border-b border-border bg-surface/40 text-left font-mono text-[10px] uppercase tracking-widest text-text-muted">
								<th className="px-6 py-2.5 font-medium">Name</th>
								<th className="px-6 py-2.5 font-medium">Email</th>
								<th className="px-6 py-2.5 font-medium">Role</th>
								<th className="px-6 py-2.5 font-medium">Interests</th>
								<th className="px-6 py-2.5 font-medium text-right">Refs</th>
								<th className="px-6 py-2.5 font-medium">Code</th>
								<th className="px-6 py-2.5 font-medium">Joined</th>
							</tr>
						</thead>
						<tbody>
							{filtered.length === 0 ? (
								<tr>
									<td
										colSpan={7}
										className="px-6 py-12 text-center text-sm text-text-muted"
									>
										{list.length === 0
											? "No signups yet."
											: "No matches for the current filter."}
									</td>
								</tr>
							) : (
								filtered.map((row) => (
									<tr
										key={row.id}
										className="border-b border-border last:border-b-0 transition-colors hover:bg-surface/40"
									>
										<td className="px-6 py-3 whitespace-nowrap">
											<div className="flex items-center gap-3">
												<Avatar name={row.name} size={28} />
												<span className="font-medium text-text-primary">
													{row.name}
												</span>
											</div>
										</td>
										<td className="px-6 py-3 truncate max-w-[220px] text-text-secondary">
											{row.email}
										</td>
										<td className="px-6 py-3 whitespace-nowrap text-text-secondary">
											{row.role}
											{row.otherRole ? (
												<span className="text-text-muted"> · {row.otherRole}</span>
											) : null}
										</td>
										<td className="px-6 py-3 max-w-[220px]">
											<div className="flex flex-wrap gap-1">
												{row.interests.slice(0, 3).map((interest) => (
													<span
														key={interest}
														className="inline-flex items-center rounded-[4px] border border-border bg-surface/60 px-1.5 py-0.5 font-mono text-[10px] text-text-secondary"
													>
														{interest}
													</span>
												))}
												{row.interests.length > 3 && (
													<span className="font-mono text-[10px] text-text-muted">
														+{row.interests.length - 3}
													</span>
												)}
											</div>
										</td>
										<td className="px-6 py-3 text-right font-mono text-[13px] tabular-nums text-text-primary">
											{row.referralCount}
										</td>
										<td className="px-6 py-3 font-mono text-[12px] text-accent">
											{row.referralCode}
										</td>
										<td className="px-6 py-3 font-mono text-[12px] text-text-muted whitespace-nowrap">
											{formatRelative(row.signedUpAt)}
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</Panel>
		</div>
	);
}

function BarList({
	data,
	total,
	className,
}: {
	data: Array<{ name: string; value: number }>;
	total?: number;
	className?: string;
}) {
	if (data.length === 0) {
		return <p className="mt-4 text-sm text-text-muted">No data yet.</p>;
	}
	const max = Math.max(...data.map((d) => d.value), 1);
	return (
		<div className={className}>
			<ul className="space-y-3">
				{data.map((d) => {
					const pct = (d.value / max) * 100;
					const ofTotal = total && total > 0 ? (d.value / total) * 100 : null;
					return (
						<li key={d.name} className="group">
							<div className="flex items-baseline justify-between gap-3">
								<span className="truncate text-sm text-text-primary">
									{d.name}
								</span>
								<span className="flex items-baseline gap-2">
									{ofTotal !== null && (
										<span className="font-mono text-[10px] text-text-muted tabular-nums">
											{ofTotal.toFixed(0)}%
										</span>
									)}
									<span className="font-mono text-[12px] tabular-nums text-text-secondary">
										{d.value}
									</span>
								</span>
							</div>
							<div className="mt-1.5 h-1.5 w-full rounded-full bg-surface overflow-hidden">
								<div
									className="h-full rounded-full bg-accent/70 transition-all group-hover:bg-accent"
									style={{ width: `${pct}%` }}
								/>
							</div>
						</li>
					);
				})}
			</ul>
		</div>
	);
}

function toCsv(rows: Array<Record<string, unknown>>): string {
	if (rows.length === 0) return "";
	const headers = [
		"name",
		"email",
		"role",
		"interests",
		"referralCount",
		"referralCode",
		"signedUpAt",
	];
	const escape = (v: unknown): string => {
		const s = v == null ? "" : Array.isArray(v) ? v.join("|") : String(v);
		return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
	};
	const headerRow = headers.join(",");
	const dataRows = rows.map((r) =>
		headers
			.map((h) => {
				if (h === "signedUpAt") {
					return escape(new Date(r.signedUpAt as number).toISOString());
				}
				return escape(r[h]);
			})
			.join(","),
	);
	return [headerRow, ...dataRows].join("\n");
}

function LoadingState() {
	return (
		<div className="space-y-8">
			<div>
				<div className="h-3 w-24 animate-pulse rounded-[4px] bg-surface" />
				<div className="mt-3 h-9 w-48 animate-pulse rounded-[4px] bg-surface" />
				<div className="mt-2 h-3 w-72 animate-pulse rounded-[4px] bg-surface/60" />
			</div>
			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				{[1, 2, 3, 4].map((i) => (
					<div key={i} className="h-[120px] animate-pulse rounded-card bg-surface" />
				))}
			</div>
			<div className="h-64 animate-pulse rounded-card bg-surface" />
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<div className="h-72 animate-pulse rounded-card bg-surface" />
				<div className="h-72 animate-pulse rounded-card bg-surface" />
			</div>
		</div>
	);
}
