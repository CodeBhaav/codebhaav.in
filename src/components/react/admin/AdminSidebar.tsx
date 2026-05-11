import { useEffect, useState } from "react";
import {
	ArrowLeft,
	Crown,
	LayoutDashboard,
	Lightbulb,
	PanelLeftClose,
	PanelLeftOpen,
	Rocket,
	UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavKey =
	| "overview"
	| "waitlist"
	| "founding-members"
	| "ideas"
	| "projects";

const NAV_ITEMS: ReadonlyArray<{
	key: NavKey;
	label: string;
	href: string;
	Icon: typeof LayoutDashboard;
}> = [
	{ key: "overview", label: "Overview", href: "/admin", Icon: LayoutDashboard },
	{ key: "waitlist", label: "Waitlist", href: "/admin/waitlist", Icon: UsersRound },
	{
		key: "founding-members",
		label: "Founding Members",
		href: "/admin/founding-members",
		Icon: Crown,
	},
	{ key: "ideas", label: "Ideas", href: "/admin/ideas", Icon: Lightbulb },
	{ key: "projects", label: "Projects", href: "/admin/projects", Icon: Rocket },
];

const STORAGE_KEY = "cb_admin_sidebar_collapsed";

export function AdminSidebar({ active }: { active: NavKey }) {
	const [collapsed, setCollapsed] = useState(false);
	const [hydrated, setHydrated] = useState(false);

	useEffect(() => {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			setCollapsed(stored === "1");
		} catch {
			// noop
		}
		setHydrated(true);
	}, []);

	useEffect(() => {
		if (!hydrated) return;
		try {
			localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
		} catch {
			// noop
		}
		// Notify the layout so the main column can adjust if needed.
		document.documentElement.dataset.adminSidebar = collapsed
			? "collapsed"
			: "expanded";
	}, [collapsed, hydrated]);

	return (
		<aside
			data-collapsed={collapsed}
			className={cn(
				"hidden lg:flex lg:flex-col shrink-0 border-r border-border bg-surface/40 sticky top-0 h-screen transition-[width] duration-200 ease-out",
				collapsed ? "lg:w-[68px]" : "lg:w-[240px]",
			)}
		>
			<div
				className={cn(
					"flex h-16 items-center border-b border-border",
					collapsed ? "justify-center px-2" : "justify-between pl-6 pr-3",
				)}
			>
				{!collapsed && (
					<a
						href="/"
						className="group flex items-center gap-2 text-base font-semibold tracking-tight text-text-primary"
					>
						<img
							src="/logo-mark.svg"
							alt=""
							width={24}
							height={24}
							className="size-6 transition-transform group-hover:scale-105"
						/>
						<span>CodeBhaav</span>
					</a>
				)}
				<button
					type="button"
					onClick={() => setCollapsed((c) => !c)}
					aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
					title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
					className="inline-flex size-8 items-center justify-center rounded-button text-text-muted transition-colors hover:bg-surface hover:text-text-primary"
				>
					{collapsed ? (
						<PanelLeftOpen className="size-4" aria-hidden />
					) : (
						<PanelLeftClose className="size-4" aria-hidden />
					)}
				</button>
			</div>

			{!collapsed && (
				<div className="px-6 pt-6 pb-3">
					<p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
						Admin
					</p>
				</div>
			)}

			<nav
				className={cn(
					"flex flex-1 flex-col gap-0.5",
					collapsed ? "px-2 pt-4" : "px-3",
				)}
			>
				{NAV_ITEMS.map((item) => {
					const isActive = active === item.key;
					const Icon = item.Icon;
					return (
						<a
							key={item.key}
							href={item.href}
							aria-current={isActive ? "page" : undefined}
							title={collapsed ? item.label : undefined}
							className={cn(
								"group relative flex items-center rounded-button text-sm transition-colors",
								collapsed
									? "size-12 justify-center"
									: "gap-3 px-3 py-2",
								isActive
									? "bg-accent/10 text-accent"
									: "text-text-secondary hover:bg-surface hover:text-text-primary",
							)}
						>
							{isActive && (
								<span
									className={cn(
										"absolute left-0 top-1/2 h-5 -translate-y-1/2 w-0.5 rounded-r-full bg-accent",
										collapsed && "left-[-8px]",
									)}
									aria-hidden
								/>
							)}
							<Icon
								className={cn(
									"shrink-0 size-4 transition-colors",
									isActive
										? "text-accent"
										: "text-text-muted group-hover:text-text-secondary",
								)}
								aria-hidden
							/>
							{!collapsed && <span className="truncate">{item.label}</span>}
						</a>
					);
				})}
			</nav>

			<div className={cn("border-t border-border", collapsed ? "p-2" : "p-3")}>
				<a
					href="/dashboard"
					title={collapsed ? "Back to dashboard" : undefined}
					className={cn(
						"group flex items-center rounded-button text-xs text-text-muted transition-colors hover:bg-surface hover:text-text-primary",
						collapsed
							? "size-12 justify-center"
							: "justify-between px-3 py-2",
					)}
				>
					{collapsed ? (
						<ArrowLeft className="size-4" aria-hidden />
					) : (
						<>
							<span>Back to dashboard</span>
							<ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" aria-hidden />
						</>
					)}
				</a>
			</div>
		</aside>
	);
}

export function AdminMobileNav({ active }: { active: NavKey }) {
	return (
		<>
			<header className="lg:hidden h-14 flex items-center justify-between border-b border-border px-4 bg-surface/40 backdrop-blur-sm sticky top-0 z-10">
				<a
					href="/"
					className="flex items-center gap-2 text-sm font-semibold text-text-primary"
				>
					<img
						src="/logo-mark.svg"
						alt=""
						width={20}
						height={20}
						className="size-5"
					/>
					<span>CodeBhaav · Admin</span>
				</a>
				<a
					href="/dashboard"
					className="font-mono text-[11px] uppercase tracking-widest text-text-muted hover:text-text-primary"
				>
					Exit
				</a>
			</header>
			<nav className="lg:hidden flex border-b border-border bg-surface/40 overflow-x-auto sticky top-14 z-10 backdrop-blur-sm">
				{NAV_ITEMS.map((item) => {
					const isActive = active === item.key;
					const Icon = item.Icon;
					return (
						<a
							key={item.key}
							href={item.href}
							aria-current={isActive ? "page" : undefined}
							className={cn(
								"relative flex shrink-0 items-center gap-2 px-4 py-3 text-xs font-medium transition-colors whitespace-nowrap",
								isActive
									? "text-accent"
									: "text-text-secondary hover:text-text-primary",
							)}
						>
							<Icon className="size-3.5" aria-hidden />
							{item.label}
							{isActive && (
								<span
									className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-accent"
									aria-hidden
								/>
							)}
						</a>
					);
				})}
			</nav>
		</>
	);
}
