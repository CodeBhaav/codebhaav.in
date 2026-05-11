import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Hammer, Lightbulb, MessageSquare, Rocket } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import {
	CATEGORIES,
	CATEGORY_KEYS,
	type CategoryKey,
} from "../../../../convex/projectCategories";
import type { Id } from "../../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { formatRelative } from "../admin/AdminOverview";
import { CategoryPills } from "./CategoryPicker";
import { InterestButton } from "./InterestButton";

type Filter = "all" | "open" | "building" | "shipped";

const FILTER_LABEL: Record<Filter, string> = {
	all: "All",
	open: "Open",
	building: "Building",
	shipped: "Shipped",
};

type CategoryFilter = "all" | CategoryKey;

export function ProjectsListPanel() {
	const [filter, setFilter] = useState<Filter>("all");
	const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
	const allProjects = useQuery(api.projects.listProjects, {
		status: "all",
		sort: "status",
	});
	const toggleInterest = useMutation(api.projects.toggleInterest);

	const counts = useMemo(() => {
		const out: Record<Filter, number> = {
			all: 0,
			open: 0,
			building: 0,
			shipped: 0,
		};
		if (allProjects) {
			out.all = allProjects.length;
			for (const p of allProjects) out[p.status] += 1;
		}
		return out;
	}, [allProjects]);

	const visible = useMemo(() => {
		if (!allProjects) return [];
		let rows = allProjects;
		if (filter !== "all") {
			rows = rows.filter((p) => p.status === filter);
		}
		if (categoryFilter !== "all") {
			rows = rows.filter((p) => p.categories.includes(categoryFilter));
		}
		return rows;
	}, [allProjects, filter, categoryFilter]);

	return (
		<div className="space-y-6">
			<header>
				<p className="font-mono text-[11px] uppercase tracking-widest text-text-muted">
					Build with the community
				</p>
				<h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
					Projects
				</h1>
				<p className="mt-1.5 max-w-xl text-sm text-text-secondary">
					Ideas the community shaped, picked, and built (or are picking up
					next). Drop a comment to influence what gets built, or volunteer to
					join a build team.
				</p>
			</header>

			<div className="flex flex-wrap items-center gap-2">
				<div className="flex items-center gap-1 rounded-button border border-border bg-card p-1 w-fit">
					{(Object.keys(FILTER_LABEL) as Filter[]).map((f) => (
						<button
							key={f}
							type="button"
							onClick={() => setFilter(f)}
							className={cn(
								"inline-flex items-center gap-1.5 rounded-[4px] px-3 py-1 text-xs font-medium transition-colors",
								filter === f
									? "bg-accent/10 text-accent"
									: "text-text-secondary hover:bg-surface hover:text-text-primary",
							)}
						>
							{FILTER_LABEL[f]}
							<span
								className={cn(
									"rounded-[3px] px-1 font-mono text-[10px] tabular-nums",
									filter === f
										? "bg-accent/20 text-accent"
										: "bg-surface text-text-muted",
								)}
							>
								{counts[f]}
							</span>
						</button>
					))}
				</div>
				<div className="flex items-center gap-1 overflow-x-auto rounded-button border border-border bg-card p-1 w-fit">
					{(["all", ...CATEGORY_KEYS] as CategoryFilter[]).map((c) => (
						<button
							key={c}
							type="button"
							onClick={() => setCategoryFilter(c)}
							className={cn(
								"rounded-[4px] px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap",
								categoryFilter === c
									? "bg-accent/10 text-accent"
									: "text-text-secondary hover:bg-surface hover:text-text-primary",
							)}
						>
							{c === "all" ? "All" : CATEGORIES[c].label}
						</button>
					))}
				</div>
			</div>

			{allProjects === undefined ? (
				<LoadingState />
			) : visible.length === 0 ? (
				<EmptyState filter={filter} />
			) : (
				<ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
					{visible.map((p) => (
						<li key={p.id}>
							<ProjectCard
								project={p}
								onToggleInterest={async () => {
									await toggleInterest({
										projectId: p.id as Id<"project">,
									});
								}}
							/>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

interface ProjectSummary {
	id: string;
	slug: string;
	title: string;
	description: string;
	techStack: string[];
	status: "open" | "building" | "shipped";
	interestCount: number;
	commentCount: number;
	originatorName: string | null;
	createdAt: number;
	buildStartedAt: number | null;
	shippedAt: number | null;
	youInterested: boolean;
	categories: string[];
}

function ProjectCard({
	project,
	onToggleInterest,
}: {
	project: ProjectSummary;
	onToggleInterest: () => Promise<void>;
}) {
	const href = `/projects/${project.slug}`;
	return (
		<a
			href={href}
			className="group flex h-full flex-col rounded-card border border-border bg-card p-5 transition-colors hover:border-border-hover"
		>
			<div className="flex items-start justify-between gap-3">
				<StatusPill status={project.status} />
				<span className="font-mono text-[11px] text-text-muted">
					{project.status === "shipped" && project.shippedAt
						? `Shipped ${formatRelative(project.shippedAt)}`
						: project.status === "building" && project.buildStartedAt
							? `Building since ${formatRelative(project.buildStartedAt)}`
							: formatRelative(project.createdAt)}
				</span>
			</div>
			{project.categories.length > 0 && (
				<CategoryPills className="mt-3" categories={project.categories} />
			)}
			<h3 className="mt-3 text-base font-semibold text-text-primary leading-snug transition-colors group-hover:text-accent">
				{project.title}
			</h3>
			<p className="mt-2 line-clamp-3 text-sm leading-relaxed text-text-secondary">
				{project.description}
			</p>
			{project.techStack.length > 0 && (
				<div className="mt-3 flex flex-wrap gap-1.5">
					{project.techStack.slice(0, 6).map((tech) => (
						<span
							key={tech}
							className="inline-flex items-center rounded-[4px] border border-border bg-surface/60 px-1.5 py-0.5 font-mono text-[10px] text-text-secondary"
						>
							{tech}
						</span>
					))}
					{project.techStack.length > 6 && (
						<span className="font-mono text-[10px] text-text-muted">
							+{project.techStack.length - 6}
						</span>
					)}
				</div>
			)}
			<div className="mt-auto flex items-end justify-between gap-3 pt-5">
				<div className="flex flex-col gap-1 text-[11px] text-text-muted">
					{project.originatorName && (
						<span className="inline-flex items-center gap-1">
							<Lightbulb className="size-3" aria-hidden />
							Idea by {project.originatorName}
						</span>
					)}
					<span className="inline-flex items-center gap-1 font-mono">
						<MessageSquare className="size-3" aria-hidden />
						{project.commentCount}{" "}
						{project.commentCount === 1 ? "comment" : "comments"}
					</span>
				</div>
				{project.status !== "shipped" && (
					<div
						className="shrink-0"
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
						}}
					>
						<InterestButton
							interested={project.youInterested}
							count={project.interestCount}
							onToggle={onToggleInterest}
							disabled={project.status === "building"}
						/>
					</div>
				)}
			</div>
		</a>
	);
}

export function StatusPill({
	status,
	size = "sm",
}: {
	status: "open" | "building" | "shipped";
	size?: "sm" | "md";
}) {
	const cfg = {
		open: {
			label: "Open",
			classes: "border-border bg-surface text-text-secondary",
			Icon: Lightbulb,
			dot: "#71717a",
		},
		building: {
			label: "Building",
			classes: "border-amber-500/40 bg-amber-500/10 text-amber-300",
			Icon: Hammer,
			dot: "#f59e0b",
		},
		shipped: {
			label: "Shipped",
			classes: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
			Icon: Rocket,
			dot: "#10b981",
		},
	}[status];
	const Icon = cfg.Icon;
	return (
		<span
			className={`inline-flex items-center gap-1.5 rounded-[4px] border ${cfg.classes} ${
				size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]"
			} font-mono uppercase tracking-wider`}
		>
			<Icon className={size === "sm" ? "size-3" : "size-3.5"} aria-hidden />
			{cfg.label}
		</span>
	);
}

function LoadingState() {
	return (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
			{[1, 2, 3, 4].map((i) => (
				<div
					key={i}
					className="h-52 animate-pulse rounded-card border border-border bg-card"
				/>
			))}
		</div>
	);
}

function EmptyState({ filter }: { filter: Filter }) {
	const message =
		filter === "all"
			? "No projects yet. The first one will come from the ideas board once the admin picks a winner."
			: `No projects in the "${FILTER_LABEL[filter]}" state right now.`;
	return (
		<div className="rounded-card border border-dashed border-border bg-background/40 px-6 py-12 text-center">
			<p className="font-mono text-base text-text-muted" aria-hidden>

			</p>
			<p className="mt-2 text-sm text-text-secondary">{message}</p>
			<a
				href="/ideas"
				className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-button border border-border bg-card px-3.5 text-xs font-medium text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
			>
				<Lightbulb className="size-3.5" aria-hidden />
				Browse ideas
			</a>
		</div>
	);
}
