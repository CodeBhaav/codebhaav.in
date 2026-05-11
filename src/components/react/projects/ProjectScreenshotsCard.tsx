import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { ImageIcon, Plus, Trash2, X } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface Props {
	projectId: string;
	canManage: boolean;
}

const MAX = 6;
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const ACCEPTED_LABEL = "JPEG, PNG, or WebP up to 5MB";

export function ProjectScreenshotsCard({ projectId, canManage }: Props) {
	const screenshots = useQuery(api.projects.listProjectScreenshots, {
		projectId: projectId as Id<"project">,
	});
	const getUploadUrl = useMutation(api.projects.getScreenshotUploadUrl);
	const addScreenshot = useMutation(api.projects.addProjectScreenshot);
	const removeScreenshot = useMutation(api.projects.removeProjectScreenshot);

	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const list = screenshots ?? [];
	const count = list.length;
	const atCap = count >= MAX;

	if (!canManage && count === 0) return null;

	const handleFiles = async (files: FileList | null) => {
		if (!files || files.length === 0) return;
		setError(null);
		setUploading(true);
		try {
			const slots = MAX - count;
			const incoming = Array.from(files).slice(0, slots);
			for (const file of incoming) {
				if (!ACCEPTED.includes(file.type)) {
					throw new Error(`${file.name}: not a supported image type`);
				}
				if (file.size > MAX_BYTES) {
					throw new Error(`${file.name}: exceeds 5MB`);
				}
				const url = await getUploadUrl({
					projectId: projectId as Id<"project">,
				});
				const res = await fetch(url, {
					method: "POST",
					headers: { "Content-Type": file.type },
					body: file,
				});
				if (!res.ok) {
					throw new Error(`${file.name}: upload failed (${res.status})`);
				}
				const { storageId } = (await res.json()) as { storageId: string };
				await addScreenshot({
					projectId: projectId as Id<"project">,
					storageId: storageId as Id<"_storage">,
				});
			}
			if (files.length > slots) {
				setError(
					`Only added ${slots} more  ${MAX} is the per-project cap.`,
				);
			}
		} catch (e) {
			setError(e instanceof Error ? e.message : "Upload failed");
		} finally {
			setUploading(false);
			if (fileInputRef.current) fileInputRef.current.value = "";
		}
	};

	const handleDelete = async (screenshotId: string) => {
		if (!confirm("Delete this screenshot?")) return;
		try {
			await removeScreenshot({
				screenshotId: screenshotId as Id<"projectScreenshot">,
			});
		} catch (e) {
			alert(e instanceof Error ? e.message : "Failed to delete");
		}
	};

	return (
		<section className="rounded-card border border-border bg-card p-6">
			<header className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-2">
					<ImageIcon className="size-4 text-accent" aria-hidden />
					<h3 className="text-base font-semibold tracking-tight text-text-primary">
						Screenshots
					</h3>
					<span className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
						{count}/{MAX}
					</span>
				</div>
				{canManage && !atCap && (
					<>
						<input
							ref={fileInputRef}
							type="file"
							accept={ACCEPTED.join(",")}
							multiple
							onChange={(e) => handleFiles(e.target.files)}
							className="hidden"
						/>
						<button
							type="button"
							disabled={uploading}
							onClick={() => fileInputRef.current?.click()}
							className={cn(
								"inline-flex h-8 items-center gap-1.5 rounded-button bg-accent px-3 text-xs font-semibold text-[#1a1208] transition-colors hover:bg-accent-hover",
								uploading && "opacity-50 cursor-not-allowed",
							)}
						>
							<Plus className="size-3.5" aria-hidden />
							{uploading ? "Uploading" : "Add screenshots"}
						</button>
					</>
				)}
			</header>

			{canManage && (
				<p className="mt-2 text-xs text-text-muted">{ACCEPTED_LABEL}</p>
			)}

			{error && (
				<p className="mt-3 text-xs text-rose-300" role="alert">
					{error}
				</p>
			)}

			{screenshots === undefined ? (
				<div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
					{[1, 2, 3].map((i) => (
						<div
							key={i}
							className="aspect-video animate-pulse rounded-[6px] border border-border bg-background/40"
						/>
					))}
				</div>
			) : count === 0 ? (
				<p className="mt-4 text-sm text-text-muted">
					{canManage
						? "Add a few screenshots once you have something to show."
						: "No screenshots yet."}
				</p>
			) : (
				<div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
					{list.map((s, i) => (
						<div
							key={s.id}
							className="group relative overflow-hidden rounded-[6px] border border-border bg-background/40"
						>
							<button
								type="button"
								onClick={() => setLightboxIndex(i)}
								className="block aspect-video w-full focus:outline-none"
							>
								{s.url ? (
									<img
										src={s.url}
										alt={s.alt ?? "Project screenshot"}
										className="size-full object-cover transition-transform group-hover:scale-[1.02]"
										loading="lazy"
									/>
								) : (
									<div className="flex size-full items-center justify-center text-text-muted">
										<ImageIcon className="size-6" aria-hidden />
									</div>
								)}
							</button>
							{canManage && (
								<button
									type="button"
									onClick={() => handleDelete(s.id)}
									className="absolute right-1.5 top-1.5 inline-flex size-7 items-center justify-center rounded-button border border-border bg-card/90 text-text-muted opacity-0 transition-opacity hover:text-rose-300 group-hover:opacity-100 focus-visible:opacity-100"
									aria-label="Delete screenshot"
								>
									<Trash2 className="size-3.5" aria-hidden />
								</button>
							)}
						</div>
					))}
				</div>
			)}

			{lightboxIndex !== null && list[lightboxIndex] && (
				<Lightbox
					url={list[lightboxIndex].url}
					alt={list[lightboxIndex].alt}
					onClose={() => setLightboxIndex(null)}
					onPrev={
						lightboxIndex > 0
							? () => setLightboxIndex(lightboxIndex - 1)
							: undefined
					}
					onNext={
						lightboxIndex < list.length - 1
							? () => setLightboxIndex(lightboxIndex + 1)
							: undefined
					}
				/>
			)}
		</section>
	);
}

function Lightbox({
	url,
	alt,
	onClose,
	onPrev,
	onNext,
}: {
	url: string | null;
	alt: string | null;
	onClose: () => void;
	onPrev?: () => void;
	onNext?: () => void;
}) {
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
			else if (e.key === "ArrowLeft" && onPrev) onPrev();
			else if (e.key === "ArrowRight" && onNext) onNext();
		};
		window.addEventListener("keydown", handler);
		const prevOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			window.removeEventListener("keydown", handler);
			document.body.style.overflow = prevOverflow;
		};
	}, [onClose, onPrev, onNext]);

	if (!url) return null;
	return (
		<div
			className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm"
			onClick={onClose}
		>
			<button
				type="button"
				onClick={onClose}
				className="absolute right-4 top-4 inline-flex size-10 items-center justify-center rounded-button border border-border bg-card/80 text-text-secondary transition-colors hover:text-text-primary"
				aria-label="Close"
			>
				<X className="size-5" aria-hidden />
			</button>
			<img
				src={url}
				alt={alt ?? "Project screenshot"}
				className="max-h-[90vh] max-w-[95vw] rounded-card border border-border object-contain"
				onClick={(e) => e.stopPropagation()}
			/>
			{onPrev && (
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						onPrev();
					}}
					className="absolute left-4 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-button border border-border bg-card/80 text-text-secondary transition-colors hover:text-text-primary"
					aria-label="Previous"
				>
					‹
				</button>
			)}
			{onNext && (
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						onNext();
					}}
					className="absolute right-4 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-button border border-border bg-card/80 text-text-secondary transition-colors hover:text-text-primary"
					aria-label="Next"
				>
					›
				</button>
			)}
		</div>
	);
}
