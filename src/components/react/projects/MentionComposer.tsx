import {
	type ChangeEvent,
	type KeyboardEvent,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { cn } from "@/lib/utils";

export interface Mention {
	clerkUserId: string;
	name: string;
	username?: string;
}

/**
 * The handle inserted into the body for an @-mention. We prefer the
 * Clerk username (unique, stable); fall back to a lowercased first-name
 * (works for our small community where most first names are unique).
 */
export function mentionHandle(m: { name: string; username?: string }): string {
	if (m.username && m.username.trim()) return m.username.trim();
	const first = m.name.split(/\s+/)[0] || m.name;
	return first.toLowerCase();
}

interface Props {
	value: string;
	onChange: (value: string, mentions: Mention[]) => void;
	mentions: Mention[];
	placeholder?: string;
	rows?: number;
	maxLength?: number;
	autoFocus?: boolean;
	className?: string;
}

interface MentionState {
	open: boolean;
	query: string;
	start: number; // index of the '@' in the textarea value
	highlight: number;
}

const INITIAL: MentionState = {
	open: false,
	query: "",
	start: 0,
	highlight: 0,
};

export function MentionComposer({
	value,
	onChange,
	mentions,
	placeholder,
	rows = 3,
	maxLength = 2000,
	autoFocus,
	className,
}: Props) {
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const [state, setState] = useState<MentionState>(INITIAL);

	const candidates = useQuery(
		api.members.searchMembers,
		state.open && state.query.length > 0
			? { prefix: state.query }
			: "skip",
	);

	const visible = useMemo(() => candidates ?? [], [candidates]);

	const detectMention = useCallback(
		(text: string, caret: number): MentionState => {
			// Walk back from caret until we find `@` or a non-mention boundary.
			let i = caret - 1;
			while (i >= 0) {
				const ch = text[i];
				if (ch === "@") {
					// Mention starts here if preceded by start-of-line or whitespace.
					const prev = i === 0 ? " " : text[i - 1];
					if (/\s/.test(prev) || i === 0) {
						const q = text.slice(i + 1, caret);
						// Stop if the query contains whitespace (mentions are single-token).
						if (/\s/.test(q)) return { ...INITIAL };
						return { open: true, query: q, start: i, highlight: 0 };
					}
					return { ...INITIAL };
				}
				if (/\s/.test(ch)) return { ...INITIAL };
				i--;
			}
			return { ...INITIAL };
		},
		[],
	);

	const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
		const next = e.target.value;
		onChange(next, mentions);
		const caret = e.target.selectionStart ?? next.length;
		setState((s) => {
			const detected = detectMention(next, caret);
			if (!detected.open) return { ...INITIAL };
			return {
				...detected,
				highlight: 0,
			};
		});
	};

	const selectCandidate = (m: Mention) => {
		const ta = textareaRef.current;
		if (!ta) return;
		const handle = mentionHandle(m);
		const before = value.slice(0, state.start);
		const after = value.slice(state.start + 1 + state.query.length);
		const inserted = `@${handle} `;
		const next = before + inserted + after;
		// Dedupe + merge mentions: if same clerkUserId already present, keep one.
		const updatedMentions = mentions.some(
			(x) => x.clerkUserId === m.clerkUserId,
		)
			? mentions
			: [...mentions, { clerkUserId: m.clerkUserId, name: m.name, username: m.username }];
		onChange(next, updatedMentions);
		setState({ ...INITIAL });
		requestAnimationFrame(() => {
			const caret = state.start + inserted.length;
			ta.focus();
			ta.setSelectionRange(caret, caret);
		});
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
		if (!state.open || visible.length === 0) return;
		if (e.key === "ArrowDown") {
			e.preventDefault();
			setState((s) => ({
				...s,
				highlight: (s.highlight + 1) % visible.length,
			}));
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setState((s) => ({
				...s,
				highlight: (s.highlight - 1 + visible.length) % visible.length,
			}));
		} else if (e.key === "Enter" || e.key === "Tab") {
			e.preventDefault();
			selectCandidate(visible[state.highlight]);
		} else if (e.key === "Escape") {
			e.preventDefault();
			setState({ ...INITIAL });
		}
	};

	useEffect(() => {
		if (!autoFocus) return;
		// Fire on this tick AND on the next animation frame  some browser /
		// React commit timings leave the DOM value un-updated when we first
		// read it, which dropped the cursor at index 0.
		const place = () => {
			const ta = textareaRef.current;
			if (!ta) return;
			ta.focus();
			const end = ta.value.length;
			ta.setSelectionRange(end, end);
		};
		place();
		const id = requestAnimationFrame(place);
		return () => cancelAnimationFrame(id);
	}, [autoFocus]);

	const backdropRef = useRef<HTMLDivElement>(null);
	const handleScroll = useCallback(() => {
		const ta = textareaRef.current;
		const bg = backdropRef.current;
		if (ta && bg) bg.style.transform = `translateY(${-ta.scrollTop}px)`;
	}, []);

	return (
		<div className={cn("relative", className)}>
			<div
				aria-hidden
				className="pointer-events-none absolute inset-0 overflow-hidden"
			>
				<div
					ref={backdropRef}
					className="px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words min-h-[88px]"
				>
					<BackdropBody body={value} mentions={mentions} />
					{/* Trailing newline placeholder so the backdrop height tracks the textarea
					    when the user ends with \n */}
					{value.endsWith("\n") && <span aria-hidden>{" "}</span>}
				</div>
			</div>
			<textarea
				ref={textareaRef}
				value={value}
				onChange={handleChange}
				onKeyDown={handleKeyDown}
				onScroll={handleScroll}
				onBlur={() => {
					// Defer so click on a candidate still registers.
					setTimeout(() => setState({ ...INITIAL }), 120);
				}}
				placeholder={placeholder}
				rows={rows}
				maxLength={maxLength}
				className="relative z-10 w-full resize-y bg-transparent px-4 py-3 text-sm leading-relaxed text-transparent placeholder:text-text-muted outline-none min-h-[88px]"
				style={{ caretColor: "var(--text-primary)" }}
			/>
			{state.open && visible.length > 0 && (
				<ul
					role="listbox"
					className="absolute bottom-full left-3 z-20 mb-1 w-64 max-h-56 overflow-y-auto rounded-card border border-border bg-card shadow-2xl"
				>
					{visible.map((m, i) => (
						<li
							key={m.clerkUserId}
							onMouseDown={(e) => {
								e.preventDefault();
								selectCandidate(m);
							}}
							className={cn(
								"flex cursor-pointer items-center gap-2 px-3 py-2 text-sm transition-colors",
								i === state.highlight
									? "bg-accent/10 text-accent"
									: "text-text-secondary hover:bg-surface",
							)}
						>
							<span className="font-medium">{m.name}</span>
							<span className="ml-auto font-mono text-[10px] text-text-muted">
								@{mentionHandle(m)}
							</span>
						</li>
					))}
				</ul>
			)}
			{state.open && state.query.length > 0 && visible.length === 0 && candidates !== undefined && (
				<div className="absolute bottom-full left-3 z-20 mb-1 rounded-card border border-border bg-card px-3 py-2 text-xs text-text-muted shadow-xl">
					No members match "{state.query}"
				</div>
			)}
		</div>
	);
}

/**
 * Render a comment body with @mentions highlighted. Mentions are matched
 * by the literal `@FirstName` substring (case-sensitive on the first name)
 * against the supplied mentions array. Anything that doesn't match falls
 * through as plain text.
 */
interface MentionToken {
	type: "text" | "mention";
	value: string;
	username?: string; // present only when the mention has a Clerk username
}

/**
 * Map every recognizable handle (username or first-name fallback) back to
 * a Clerk username, if one exists. Used to decide whether a rendered
 * mention should be a link to /u/[username] or just stylized text.
 */
function buildHandleLookup(
	mentions: Mention[],
): { handles: string[]; usernameByHandle: Map<string, string> } {
	const usernameByHandle = new Map<string, string>();
	for (const m of mentions) {
		if (m.username) {
			usernameByHandle.set(m.username.toLowerCase(), m.username);
		}
		const first = (m.name.split(/\s+/)[0] || "").toLowerCase();
		if (first && m.username) {
			// Old first-name mentions get linked too, when we know the username.
			if (!usernameByHandle.has(first)) {
				usernameByHandle.set(first, m.username);
			}
		}
	}
	const handles = new Set<string>();
	for (const m of mentions) {
		if (m.username) handles.add(m.username.toLowerCase());
		const first = (m.name.split(/\s+/)[0] || "").toLowerCase();
		if (first) handles.add(first);
		const firstCap = m.name.split(/\s+/)[0];
		if (firstCap) handles.add(firstCap);
	}
	return { handles: Array.from(handles), usernameByHandle };
}

function tokenizeBody(body: string, mentions: Mention[]): MentionToken[] {
	const { handles, usernameByHandle } = buildHandleLookup(mentions);
	if (handles.length === 0) return [{ type: "text", value: body }];
	const pattern = new RegExp(
		`@(${handles
			.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
			.join("|")})\\b`,
		"gi",
	);
	const out: MentionToken[] = [];
	let last = 0;
	let match: RegExpExecArray | null;
	while ((match = pattern.exec(body)) !== null) {
		if (match.index > last) {
			out.push({ type: "text", value: body.slice(last, match.index) });
		}
		const handle = match[1].toLowerCase();
		out.push({
			type: "mention",
			value: match[0],
			username: usernameByHandle.get(handle),
		});
		last = match.index + match[0].length;
	}
	if (last < body.length) {
		out.push({ type: "text", value: body.slice(last) });
	}
	return out;
}

export function RenderedBody({
	body,
	mentions,
}: {
	body: string;
	mentions: Mention[];
}) {
	const tokens = useMemo(() => tokenizeBody(body, mentions), [body, mentions]);

	return (
		<p className="whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
			{tokens.map((t, i) => {
				if (t.type !== "mention") {
					return <span key={i}>{t.value}</span>;
				}
				if (t.username) {
					return (
						<a
							key={i}
							href={`/u/${t.username}`}
							className="rounded-[3px] bg-accent/10 px-1 font-medium text-accent transition-colors hover:bg-accent/20 hover:underline"
						>
							{t.value}
						</a>
					);
				}
				return (
					<span
						key={i}
						className="rounded-[3px] bg-accent/10 px-1 font-medium text-accent"
					>
						{t.value}
					</span>
				);
			})}
		</p>
	);
}

/**
 * Backdrop renderer used by the composer overlay. Mirrors the textarea
 * text with mention tokens wrapped in a styled span; the rest is plain
 * text so the textarea's caret/selection align character-by-character.
 *
 * IMPORTANT: every character in `value` must appear in this output for
 * the offsets to match. We use rounded backgrounds with negative-margin
 * padding so we don't change horizontal advance.
 */
export function BackdropBody({
	body,
	mentions,
}: {
	body: string;
	mentions: Mention[];
}) {
	const tokens = useMemo(() => tokenizeBody(body, mentions), [body, mentions]);

	return (
		<>
			{tokens.map((t, i) =>
				t.type === "mention" ? (
					// Visual-only mention pill behind the textarea  no anchor here
					// since the textarea overlay swallows clicks. Keep zero-width
					// styling so caret offsets in the textarea remain aligned.
					<span
						key={i}
						className="rounded-[2px] bg-accent/10 text-accent"
					>
						{t.value}
					</span>
				) : (
					<span key={i} className="text-text-primary">
						{t.value}
					</span>
				),
			)}
		</>
	);
}
