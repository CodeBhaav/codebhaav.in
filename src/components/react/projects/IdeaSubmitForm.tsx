import { useState } from "react";
import { useMutation } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { api } from "../../../../convex/_generated/api";
import { cn } from "@/lib/utils";

const MIN_TITLE = 8;
const MAX_TITLE = 140;
const MIN_DESC = 20;
const MAX_DESC = 4000;

interface Props {
	onSuccess?: (ideaId: string) => void;
	className?: string;
}

export function IdeaSubmitForm({ onSuccess, className }: Props) {
	const { user, isLoaded } = useUser();
	const submit = useMutation(api.projectIdeas.submitIdea);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [savedAt, setSavedAt] = useState<number | null>(null);

	const titleOk = title.trim().length >= MIN_TITLE && title.length <= MAX_TITLE;
	const descOk =
		description.trim().length >= MIN_DESC && description.length <= MAX_DESC;
	const canSubmit = titleOk && descOk && !submitting;

	if (isLoaded && !user) {
		return (
			<div
				className={cn(
					"rounded-card border border-dashed border-border bg-background/40 px-5 py-6 text-center",
					className,
				)}
			>
				<p className="text-sm text-text-secondary">
					<a href="/sign-in" className="text-accent hover:text-accent-hover">
						Sign in
					</a>{" "}
					to share an idea.
				</p>
			</div>
		);
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!canSubmit) return;
		setSubmitting(true);
		setError(null);
		try {
			const res = await submit({
				title: title.trim(),
				description: description.trim(),
			});
			setTitle("");
			setDescription("");
			setSavedAt(Date.now());
			onSuccess?.(res.id);
		} catch (e) {
			setError(
				e instanceof Error ? e.message : "Failed to submit. Try again.",
			);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<form
			onSubmit={handleSubmit}
			className={cn(
				"rounded-card border border-border bg-card p-5",
				className,
			)}
			noValidate
		>
			<header className="mb-4">
				<h2 className="text-base font-semibold tracking-tight text-text-primary">
					Share an idea
				</h2>
				<p className="mt-0.5 text-xs text-text-muted">
					Drop something the community might want to build. Title + a paragraph
					describing the why and what.
				</p>
			</header>

			<label className="block">
				<span className="block text-xs font-medium text-text-secondary">
					Title
				</span>
				<input
					type="text"
					value={title}
					maxLength={MAX_TITLE}
					onChange={(e) => setTitle(e.target.value)}
					placeholder="A short, punchy title"
					className="mt-1.5 w-full rounded-button border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
				/>
				<div className="mt-1 flex items-center justify-between text-[10px] font-mono text-text-muted">
					<span>
						{title.trim().length < MIN_TITLE
							? `${MIN_TITLE - title.trim().length} more characters`
							: "Looks good"}
					</span>
					<span>
						{title.length}/{MAX_TITLE}
					</span>
				</div>
			</label>

			<label className="mt-4 block">
				<span className="block text-xs font-medium text-text-secondary">
					Description
				</span>
				<textarea
					value={description}
					maxLength={MAX_DESC}
					onChange={(e) => setDescription(e.target.value)}
					rows={5}
					placeholder="What's the problem, who's it for, why does it matter? You don't need tech details  the community will help shape that."
					className="mt-1.5 w-full resize-y rounded-button border border-border bg-background px-3 py-2 text-sm leading-relaxed text-text-primary placeholder:text-text-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 min-h-[120px]"
				/>
				<div className="mt-1 flex items-center justify-between text-[10px] font-mono text-text-muted">
					<span>
						{description.trim().length < MIN_DESC
							? `${MIN_DESC - description.trim().length} more characters`
							: "Looks good"}
					</span>
					<span>
						{description.length}/{MAX_DESC}
					</span>
				</div>
			</label>

			{error && (
				<p className="mt-3 text-xs text-rose-300" role="alert">
					{error}
				</p>
			)}
			{savedAt && (
				<p className="mt-3 text-xs text-emerald-300" role="status">
					Submitted. The community can now upvote and comment.
				</p>
			)}

			<div className="mt-5 flex items-center justify-end">
				<button
					type="submit"
					disabled={!canSubmit}
					className="inline-flex h-9 items-center rounded-button bg-accent px-4 text-xs font-semibold text-[#1a1208] transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
				>
					{submitting ? "Submitting…" : "Submit idea"}
				</button>
			</div>
		</form>
	);
}
