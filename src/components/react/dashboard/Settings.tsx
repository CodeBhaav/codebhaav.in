import { useEffect, useState } from "react";
import { useUser, UserButton } from "@clerk/clerk-react";
import { useMutation, useQuery } from "convex/react";
import { Activity, ArrowLeft, BellRing, Calendar, Crown, Megaphone } from "lucide-react";
import posthog from "posthog-js";
import { api } from "../../../../convex/_generated/api";
import { TOPICS, type TopicSlug } from "../../../../convex/resendResources";
import { Switch } from "@/components/react/ui/switch";

type TopicState = Partial<Record<TopicSlug, boolean>>;

const TOPIC_ICON: Record<TopicSlug, React.ComponentType<{ className?: string }>> = {
	community_updates: BellRing,
	product_announcements: Megaphone,
	event_invitations: Calendar,
	activity_updates: Activity,
	founders_only: Crown,
};

export function Settings() {
	const { user, isLoaded } = useUser();
	const prefs = useQuery(
		api.userProfile.getMyTopicSubscriptions,
		user ? {} : "skip",
	);
	const setPrefs = useMutation(api.userProfile.setMyTopicSubscriptions);

	const [optimistic, setOptimistic] = useState<TopicState>({});
	const [savingSlug, setSavingSlug] = useState<TopicSlug | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [savedAt, setSavedAt] = useState<number | null>(null);

	useEffect(() => {
		if (savedAt === null) return;
		const t = setTimeout(() => setSavedAt(null), 2500);
		return () => clearTimeout(t);
	}, [savedAt]);

	if (!isLoaded) return <LoadingState />;

	if (!user) {
		return (
			<div className="py-12 text-center">
				<p className="text-base text-text-secondary">
					Please sign in to manage your settings.
				</p>
				<a
					href="/sign-in"
					className="mt-4 inline-flex h-10 items-center justify-center rounded-button bg-gradient-to-b from-[#F59E0B] to-[#D97706] px-6 text-sm font-semibold text-[#1a1208] shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] ring-1 ring-[#D97706] transition-all hover:from-[#FBBF24] hover:to-[#F59E0B]"
				>
					Sign In
				</a>
			</div>
		);
	}

	if (prefs === undefined) return <LoadingState />;
	if (prefs === null) return <LoadingState />;

	const handleToggle = async (slug: TopicSlug, next: boolean) => {
		setOptimistic((prev) => ({ ...prev, [slug]: next }));
		setSavingSlug(slug);
		setError(null);
		try {
			await setPrefs({ topics: { [slug]: next } });
			setSavedAt(Date.now());
			posthog.capture("settings_topic_toggled", { topic: slug, value: next });
		} catch (err) {
			setOptimistic((prev) => {
				const next = { ...prev };
				delete next[slug];
				return next;
			});
			setError(err instanceof Error ? err.message : "Failed to update");
		} finally {
			setSavingSlug(null);
		}
	};

	const checkedFor = (slug: TopicSlug): boolean => {
		if (slug in optimistic) return Boolean(optimistic[slug]);
		return Boolean(prefs.topics[slug]);
	};

	return (
		<div>
			<div className="mb-8 flex items-center justify-between gap-4">
				<a
					href="/dashboard"
					className="inline-flex items-center gap-1.5 text-xs text-text-muted transition-colors hover:text-text-primary"
				>
					<ArrowLeft className="size-3.5" aria-hidden />
					Back to dashboard
				</a>
				<UserButton afterSignOutUrl="/" />
			</div>

			<header className="mb-8">
				<p className="font-mono text-[11px] uppercase tracking-widest text-text-muted">
					Settings
				</p>
				<h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
					Email preferences
				</h1>
				<p className="mt-1.5 text-sm text-text-secondary">
					Choose exactly what you want to hear from us. Changes save automatically.
				</p>
			</header>

			<div className="space-y-3">
				{prefs.visible.map((slug) => {
					const def = TOPICS[slug];
					const Icon = TOPIC_ICON[slug];
					const isSaving = savingSlug === slug;
					return (
						<div
							key={slug}
							className="rounded-card border border-border bg-card p-5"
						>
							<div className="flex items-start justify-between gap-4">
								<div className="flex items-start gap-3 min-w-0">
									<span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-button border border-border bg-background">
										<Icon
											className="size-4 text-text-muted"
											aria-hidden
										/>
									</span>
									<div className="min-w-0">
										<div className="flex items-center gap-2">
											<p className="text-sm font-medium text-text-primary">
												{def.name}
											</p>
											{slug === "founders_only" && (
												<span className="inline-flex items-center rounded-[4px] border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-amber-300">
													Founders
												</span>
											)}
										</div>
										<p className="mt-1 text-xs leading-relaxed text-text-muted">
											{def.description}
										</p>
									</div>
								</div>
								<div className="flex items-center gap-2 shrink-0">
									{isSaving && (
										<span className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
											saving
										</span>
									)}
									<Switch
										checked={checkedFor(slug)}
										onCheckedChange={(v) => handleToggle(slug, v)}
										disabled={isSaving}
										aria-label={`Toggle ${def.name}`}
									/>
								</div>
							</div>
						</div>
					);
				})}
			</div>

			{(savedAt !== null || error) && (
				<div className="mt-4 text-xs">
					{error ? (
						<span className="text-rose-300">{error}</span>
					) : (
						<span className="text-emerald-300">
							Saved.
						</span>
					)}
				</div>
			)}

			<p className="mt-8 text-[11px] leading-relaxed text-text-muted">
				Transactional emails (waitlist confirmations, application status, password
				resets) are always sent  these toggles only control marketing emails.
			</p>
		</div>
	);
}

function LoadingState() {
	return (
		<div className="py-12">
			<div className="mb-6 h-5 w-48 animate-pulse rounded-[4px] bg-border" />
			<div className="space-y-3">
				{[1, 2, 3].map((i) => (
					<div
						key={i}
						className="h-24 animate-pulse rounded-card border border-border bg-card"
					/>
				))}
			</div>
		</div>
	);
}
