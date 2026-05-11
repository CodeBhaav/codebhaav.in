import { useEffect } from "react";
import { SignInButton, useUser } from "@clerk/clerk-react";
import { useMutation, usePaginatedQuery } from "convex/react";
import { ArrowLeft, BellRing, CheckCheck } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { formatRelative } from "../admin/AdminOverview";
import {
	notificationHeadline,
	notificationSubtitle,
	type NotificationRow,
} from "./NotificationFormat";

const PAGE_SIZE = 30;

export function NotificationInbox() {
	const { user, isLoaded } = useUser();
	const list = usePaginatedQuery(
		api.notifications.listMyNotifications,
		user ? {} : "skip",
		{ initialNumItems: PAGE_SIZE },
	);
	const markRead = useMutation(api.notifications.markRead);
	const markAllRead = useMutation(api.notifications.markAllRead);

	// Auto-mark first-page unread items as read on visit — matches the
	// behavior of opening an inbox. We do it lazily after the page renders
	// so the unread dot is briefly visible.
	useEffect(() => {
		if (!user) return;
		if (list.status !== "CanLoadMore" && list.status !== "Exhausted") return;
		const unreadIds = list.results
			.filter((n) => !n.read)
			.map((n) => n.id as Id<"notification">);
		if (unreadIds.length === 0) return;
		const t = setTimeout(() => {
			markRead({ ids: unreadIds }).catch(() => {
				/* swallow  retried on next visit */
			});
		}, 1200);
		return () => clearTimeout(t);
		// We only want this to fire once per pagination cycle. Reading
		// list.results.length is enough to gate it.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user, list.results.length, list.status]);

	if (!isLoaded) return <LoadingState />;
	if (!user) return <SignedOutState />;

	const unread = list.results.filter((n) => !n.read).length;

	return (
		<div className="space-y-6">
			<a
				href="/dashboard"
				className="inline-flex items-center gap-1.5 text-xs text-text-muted transition-colors hover:text-text-primary"
			>
				<ArrowLeft className="size-3.5" aria-hidden />
				Back to dashboard
			</a>

			<header className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-bold tracking-tight text-text-primary">
						Notifications
					</h1>
					<p className="mt-1 text-xs text-text-muted">
						Mentions, replies, status changes, and team activity.
					</p>
				</div>
				{unread > 0 && (
					<button
						type="button"
						onClick={async () => {
							await markAllRead({});
						}}
						className="inline-flex h-9 items-center gap-1.5 rounded-button border border-border bg-card px-3 font-mono text-[11px] uppercase tracking-widest text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
					>
						<CheckCheck className="size-3.5" aria-hidden />
						Mark all read
					</button>
				)}
			</header>

			{list.status === "LoadingFirstPage" ? (
				<LoadingState />
			) : list.results.length === 0 ? (
				<EmptyState />
			) : (
				<ul className="space-y-2">
					{list.results.map((n) => (
						<NotificationItem key={n.id} n={n} />
					))}
				</ul>
			)}

			{list.status === "CanLoadMore" && (
				<div className="flex justify-center">
					<button
						type="button"
						onClick={() => list.loadMore(PAGE_SIZE)}
						className="inline-flex h-9 items-center rounded-button border border-border bg-card px-4 text-xs font-medium text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
					>
						Load older
					</button>
				</div>
			)}
			{list.status === "LoadingMore" && (
				<p className="text-center font-mono text-[11px] uppercase tracking-widest text-text-muted">
					Loading…
				</p>
			)}
		</div>
	);
}

function NotificationItem({ n }: { n: NotificationRow }) {
	const url =
		typeof n.payload.targetUrl === "string"
			? n.payload.targetUrl
			: "/dashboard";
	return (
		<li
			className={cn(
				"rounded-card border bg-card transition-colors",
				n.read
					? "border-border"
					: "border-accent/30 bg-accent/[0.04]",
			)}
		>
			<a
				href={url}
				className="flex items-start gap-3 px-4 py-3 hover:bg-surface/40"
			>
				<span
					className={cn(
						"mt-1 inline-flex size-2 shrink-0 rounded-full",
						n.read ? "bg-border" : "bg-accent",
					)}
					aria-hidden
				/>
				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-baseline gap-2">
						<p className="text-sm font-medium text-text-primary">
							{notificationHeadline(n)}
						</p>
						<span className="font-mono text-[10px] text-text-muted">
							{formatRelative(n.createdAt)}
						</span>
					</div>
					<p className="mt-1 text-xs leading-relaxed text-text-secondary">
						{notificationSubtitle(n)}
					</p>
				</div>
			</a>
		</li>
	);
}

function EmptyState() {
	return (
		<div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border bg-background/40 px-6 py-12 text-center">
			<BellRing className="size-6 text-text-muted" aria-hidden />
			<p className="text-sm text-text-secondary">All caught up.</p>
			<p className="text-xs text-text-muted">
				Mentions, replies, and project updates will land here.
			</p>
		</div>
	);
}

function SignedOutState() {
	return (
		<div className="space-y-6">
			<div className="rounded-card border border-border bg-card p-6 text-center">
				<p className="text-sm font-medium text-text-primary">
					Sign in to view your notifications.
				</p>
				<div className="mt-4">
					<SignInButton mode="modal">
						<button
							type="button"
							className="inline-flex h-9 items-center rounded-button bg-accent px-4 text-sm font-semibold text-[#1a1208] transition-colors hover:bg-accent-hover"
						>
							Sign in
						</button>
					</SignInButton>
				</div>
			</div>
		</div>
	);
}

function LoadingState() {
	return (
		<div className="space-y-3">
			{[1, 2, 3, 4].map((i) => (
				<div
					key={i}
					className="h-20 animate-pulse rounded-card border border-border bg-card"
				/>
			))}
		</div>
	);
}
