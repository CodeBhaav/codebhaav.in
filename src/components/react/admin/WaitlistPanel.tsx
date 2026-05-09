import { useUser } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { MetricCard, Panel, PanelHeader } from "./AdminOverview";

export function WaitlistPanel() {
	const { user } = useUser();

	const stats = useQuery(api.admin.getWaitlistStats, user ? {} : "skip");
	const list = useQuery(api.admin.listWaitlist, user ? {} : "skip");

	if (!user || !stats || !list) {
		return <LoadingState />;
	}

	return (
		<div className="space-y-6">
			<header className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<p className="font-mono text-[11px] uppercase tracking-widest text-text-muted">
						Admin · Alpha
					</p>
					<h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
						Waitlist
					</h1>
					<p className="mt-1.5 text-sm text-text-secondary">
						Pre-launch waitlist signups. This view will be deprecated once the
						platform opens.
					</p>
				</div>
				<a
					href={`data:text/csv;charset=utf-8,${encodeURIComponent(toCsv(list))}`}
					download={`codebhaav-waitlist-${new Date().toISOString().slice(0, 10)}.csv`}
					className="inline-flex h-9 items-center rounded-button border border-border bg-surface px-4 text-xs font-medium text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
				>
					Export CSV
				</a>
			</header>

			<div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
				<MetricCard label="Total signups" value={stats.total} />
				<MetricCard label="This week" value={stats.thisWeekCount} />
				<MetricCard label="This month" value={stats.thisMonthCount} />
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
									stats.topReferrer.referralCount === 1
										? "invite"
										: "invites"
								}`
							: "no referrals yet"
					}
				/>
			</div>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<Panel>
					<PanelHeader
						title="Interests"
						hint="How many signups picked each interest tag"
					/>
					<BarList
						className="mt-5"
						data={stats.byInterest.map((b) => ({
							name: b.name,
							value: b.count,
						}))}
					/>
				</Panel>

				<Panel>
					<PanelHeader
						title="Roles"
						hint="Self-described role at signup"
					/>
					<BarList
						className="mt-5"
						data={stats.byRole.map((b) => ({
							name: b.name,
							value: b.count,
						}))}
					/>
				</Panel>
			</div>

			<Panel>
				<PanelHeader
					title="Top referrers"
					hint="By number of successful invites"
				/>
				{(() => {
					const realReferrers = stats.topReferrers.filter(
						(r) => r.referralCount > 0,
					);
					if (realReferrers.length === 0) {
						return (
							<p className="mt-6 py-6 text-center text-sm text-text-muted">
								Nobody has referred anyone yet.
							</p>
						);
					}
					return (
						<div className="mt-4 overflow-x-auto -mx-6">
							<table className="min-w-full text-sm">
								<thead>
									<tr className="text-left font-mono text-[11px] uppercase tracking-wider text-text-muted">
										<th className="px-6 py-2 font-medium">Name</th>
										<th className="px-6 py-2 font-medium">Code</th>
										<th className="px-6 py-2 font-medium text-right">
											Referrals
										</th>
									</tr>
								</thead>
								<tbody>
									{realReferrers.map((r, i) => (
										<tr
											key={r.referralCode}
											className="border-t border-border text-text-secondary"
										>
											<td className="px-6 py-3 text-text-primary font-medium">
												<span className="text-text-muted mr-2 font-mono text-xs">
													#{i + 1}
												</span>
												{r.name}
											</td>
											<td className="px-6 py-3 font-mono text-[12px] text-accent">
												{r.referralCode}
											</td>
											<td className="px-6 py-3 text-right font-mono text-[13px] text-text-primary">
												{r.referralCount}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					);
				})()}
			</Panel>

			<Panel>
				<PanelHeader
					title="All signups"
					hint={`${list.length} ${list.length === 1 ? "row" : "rows"} · sorted by most recent`}
				/>
				<div className="mt-4 overflow-x-auto -mx-6">
					<table className="min-w-full text-sm">
						<thead>
							<tr className="text-left font-mono text-[11px] uppercase tracking-wider text-text-muted">
								<th className="px-6 py-2 font-medium">Name</th>
								<th className="px-6 py-2 font-medium">Email</th>
								<th className="px-6 py-2 font-medium">Role</th>
								<th className="px-6 py-2 font-medium">Interests</th>
								<th className="px-6 py-2 font-medium">Referrals</th>
								<th className="px-6 py-2 font-medium">Code</th>
								<th className="px-6 py-2 font-medium">Joined</th>
							</tr>
						</thead>
						<tbody>
							{list.length === 0 ? (
								<tr>
									<td
										colSpan={7}
										className="px-6 py-6 text-center text-sm text-text-muted"
									>
										No signups yet.
									</td>
								</tr>
							) : (
								list.map((row) => (
									<tr
										key={row.id}
										className="border-t border-border text-text-secondary"
									>
										<td className="px-6 py-3 text-text-primary font-medium whitespace-nowrap">
											{row.name}
										</td>
										<td className="px-6 py-3 truncate max-w-[220px]">
											{row.email}
										</td>
										<td className="px-6 py-3 whitespace-nowrap">
											{row.role}
											{row.otherRole ? ` · ${row.otherRole}` : ""}
										</td>
										<td className="px-6 py-3 max-w-[200px]">
											<span className="text-xs text-text-muted">
												{row.interests.join(", ")}
											</span>
										</td>
										<td className="px-6 py-3 font-mono text-[13px] text-text-primary">
											{row.referralCount}
										</td>
										<td className="px-6 py-3 font-mono text-[12px] text-accent">
											{row.referralCode}
										</td>
										<td className="px-6 py-3 font-mono text-[12px] text-text-muted whitespace-nowrap">
											{new Date(row.signedUpAt).toLocaleDateString()}
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
	className,
}: {
	data: Array<{ name: string; value: number }>;
	className?: string;
}) {
	if (data.length === 0) {
		return (
			<p className="mt-2 text-sm text-text-muted">No data yet.</p>
		);
	}
	const max = Math.max(...data.map((d) => d.value));
	return (
		<div className={className}>
			<ul className="space-y-2.5">
				{data.map((d) => {
					const pct = max === 0 ? 0 : (d.value / max) * 100;
					return (
						<li key={d.name}>
							<div className="flex items-baseline justify-between gap-3 text-sm">
								<span className="truncate text-text-primary">{d.name}</span>
								<span className="font-mono text-[12px] text-text-secondary">
									{d.value}
								</span>
							</div>
							<div className="mt-1.5 h-1.5 w-full rounded-full bg-surface overflow-hidden">
								<div
									className="h-full rounded-full bg-accent"
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
		<div className="space-y-6">
			<div className="h-9 w-48 animate-pulse rounded-[4px] bg-surface" />
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				{[1, 2, 3, 4].map((i) => (
					<div key={i} className="h-24 animate-pulse rounded-card bg-surface" />
				))}
			</div>
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<div className="h-72 animate-pulse rounded-card bg-surface" />
				<div className="h-72 animate-pulse rounded-card bg-surface" />
			</div>
		</div>
	);
}
