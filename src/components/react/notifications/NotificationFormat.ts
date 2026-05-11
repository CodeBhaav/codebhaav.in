export interface NotificationRow {
	id: string;
	kind: string;
	payload: Record<string, unknown>;
	read: boolean;
	readAt: number | null;
	createdAt: number;
}

function asString(v: unknown, fallback = ""): string {
	return typeof v === "string" ? v : fallback;
}

/**
 * One-line headline shown in the bell dropdown and inbox list.
 * Kept short so it doesn't wrap on narrow surfaces.
 */
export function notificationHeadline(n: NotificationRow): string {
	const p = n.payload;
	switch (n.kind) {
		case "mention_in_comment": {
			const actor = asString(p.actorName, "Someone");
			const target = asString(p.targetTitle);
			return target
				? `${actor} mentioned you on "${target}"`
				: `${actor} mentioned you`;
		}
		case "reply_to_my_comment": {
			const actor = asString(p.actorName, "Someone");
			const target = asString(p.targetTitle);
			return target
				? `${actor} replied to you on "${target}"`
				: `${actor} replied to your comment`;
		}
		case "idea_status_changed": {
			const status = asString(p.status, "updated");
			const title = asString(p.ideaTitle, "Your idea");
			if (status === "promoted") return `"${title}" is now a project`;
			if (status === "rejected") return `"${title}" was closed`;
			if (status === "open") return `"${title}" was reopened`;
			return `"${title}" status updated`;
		}
		case "project_status_changed": {
			const status = asString(p.status, "updated");
			const title = asString(p.projectTitle, "A project");
			if (status === "building") return `"${title}" is now building`;
			if (status === "shipped") return `"${title}" has shipped`;
			if (status === "open") return `"${title}" is open again`;
			return `"${title}" status changed`;
		}
		case "added_to_build_team": {
			const title = asString(p.projectTitle, "a project");
			return `You're on the build team for "${title}"`;
		}
		case "team_lead_assigned": {
			const title = asString(p.projectTitle, "a project");
			return `You're the team lead for "${title}"`;
		}
		default:
			return "New activity";
	}
}

/** Optional second line  comment snippet, role, or reason. */
export function notificationSubtitle(n: NotificationRow): string {
	const p = n.payload;
	switch (n.kind) {
		case "mention_in_comment":
		case "reply_to_my_comment":
			return asString(p.snippet, "Tap to read more.");
		case "idea_status_changed": {
			const status = asString(p.status);
			if (status === "rejected" && p.reason) {
				return `Reason: ${asString(p.reason)}`;
			}
			if (status === "promoted" && p.projectTitle) {
				return `Live as "${asString(p.projectTitle)}".`;
			}
			return "Open to see what changed.";
		}
		case "project_status_changed": {
			const status = asString(p.status);
			if (status === "shipped") return "Time to celebrate.";
			if (status === "building") return "The team is assembled and starting.";
			return "Stage changed.";
		}
		case "added_to_build_team": {
			const role = asString(p.role, "team member");
			return `Role: ${role}.`;
		}
		case "team_lead_assigned":
			return "You can edit the stack, manage the team, and ship.";
		default:
			return "Tap to open.";
	}
}
