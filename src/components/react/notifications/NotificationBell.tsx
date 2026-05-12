import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useMutation, useQuery } from "convex/react";
import { Bell } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { formatRelative } from "../admin/AdminOverview";
import {
	notificationHeadline,
	notificationSubtitle,
	type NotificationRow,
} from "./NotificationFormat";

/**
 * Mount-gated wrapper. Astro SSRs every React island on the edge worker,
 * but the shared `<Providers>` short-circuits to a bare fragment when
 * `window` is undefined  no ConvexProvider in scope. Calling `useQuery`
 * in that case throws. Rendering null until `useEffect` runs guarantees
 * the inner component  and its hooks  only fire on the client.
 */
export function NotificationBell() {
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	if (!mounted) return null;
	return <NotificationBellInner />;
}

/**
 * Fixed-position bell rendered inside `<Providers>` on every signed-in
 * page. Renders null when the visitor isn't signed in. Sits in the
 * top-right just inside the navbar area; z-index above the navbar.
 */
export function NotificationBellFloating() {
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	if (!mounted) return null;
	return (
		<div className="fixed right-3 top-3 z-[55] md:right-[5.25rem] md:top-3.5">
			<NotificationBellInner />
		</div>
	);
}

function NotificationBellInner() {
	const { user, isLoaded } = useUser();
	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	const unreadCount = useQuery(
		api.notifications.getMyUnreadCount,
		user ? {} : "skip",
	);
	const recent = useQuery(
		api.notifications.listRecentNotifications,
		user && open ? { limit: 10 } : "skip",
	);
	const markRead = useMutation(api.notifications.markRead);
	const markAllRead = useMutation(api.notifications.markAllRead);

	useEffect(() => {
		if (!open) return;
		const onClick = (e: MouseEvent) => {
			if (!containerRef.current) return;
			if (containerRef.current.contains(e.target as Node)) return;
			setOpen(false);
		};
		document.addEventListener("mousedown", onClick);
		return () => document.removeEventListener("mousedown", onClick);
	}, [open]);

	if (!isLoaded || !user) return null;

	const count = unreadCount ?? 0;

	const onOpen = async () => {
		setOpen((o) => !o);
	};

	const onClickItem = async (n: NotificationRow) => {
		try {
			if (!n.read) {
				await markRead({ ids: [n.id as Id<"notification">] });
			}
		} finally {
			const url =
				typeof n.payload.targetUrl === "string"
					? n.payload.targetUrl
					: "/dashboard/notifications";
			window.location.href = url;
		}
	};

	return (
		<div ref={containerRef} className="relative">
			<button
				type="button"
				onClick={onOpen}
				className="relative inline-flex size-9 items-center justify-center rounded-button border border-border bg-background text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
				aria-label={`Notifications${count > 0 ? `, ${count} unread` : ""}`}
				aria-expanded={open}
			>
				<Bell className="size-4" aria-hidden />
				{count > 0 && (
					<span className="absolute -top-1 -right-1 inline-flex min-w-[18px] items-center justify-center rounded-full border border-background bg-accent px-1 font-mono text-[10px] font-semibold text-[#1a1208]">
						{count > 99 ? "99+" : count}
					</span>
				)}
			</button>

			{open && (
				<div className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-card border border-border bg-card shadow-2xl">
					<header className="flex items-center justify-between border-b border-border px-4 py-2.5">
						<p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
							Notifications
						</p>
						{count > 0 && (
							<button
								type="button"
								onClick={async () => {
									await markAllRead({});
								}}
								className="font-mono text-[10px] uppercase tracking-widest text-text-muted transition-colors hover:text-text-primary"
							>
								Mark all read
							</button>
						)}
					</header>
					<NotificationList
						recent={recent}
						onSelect={onClickItem}
					/>
					<a
						href="/dashboard/notifications"
						className="block border-t border-border px-4 py-2 text-center font-mono text-[10px] uppercase tracking-widest text-text-muted transition-colors hover:text-text-primary"
					>
						View all →
					</a>
				</div>
			)}
		</div>
	);
}

function NotificationList({
	recent,
	onSelect,
}: {
	recent: NotificationRow[] | undefined;
	onSelect: (n: NotificationRow) => void;
}) {
	if (recent === undefined) {
		return (
			<div className="space-y-2 p-3">
				{[1, 2, 3].map((i) => (
					<div
						key={i}
						className="h-14 animate-pulse rounded-[4px] bg-surface"
					/>
				))}
			</div>
		);
	}
	if (recent.length === 0) {
		return (
			<p className="px-4 py-8 text-center text-xs text-text-muted">
				Nothing new. Go build something.
			</p>
		);
	}
	return (
		<ul className="max-h-[60vh] overflow-y-auto">
			{recent.map((n) => (
				<li key={n.id}>
					<button
						type="button"
						onClick={() => onSelect(n)}
						className={cn(
							"flex w-full flex-col items-start gap-1 border-b border-border px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-surface/60",
							!n.read && "bg-accent/[0.04]",
						)}
					>
						<div className="flex w-full items-baseline gap-2">
							<p className="flex-1 text-sm font-medium text-text-primary">
								{notificationHeadline(n)}
							</p>
							{!n.read && (
								<span
									className="size-1.5 shrink-0 rounded-full bg-accent"
									aria-hidden
								/>
							)}
						</div>
						<p className="line-clamp-2 text-xs text-text-secondary">
							{notificationSubtitle(n)}
						</p>
						<p className="font-mono text-[10px] text-text-muted">
							{formatRelative(n.createdAt)}
						</p>
					</button>
				</li>
			))}
		</ul>
	);
}
