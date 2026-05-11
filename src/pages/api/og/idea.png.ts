import type { APIRoute } from "astro";
import { ImageResponse } from "workers-og";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { IdeaCard } from "@/lib/og/templates";

export const prerender = false;

const WIDTH = 1200;
const HEIGHT = 630;

const FONT_URLS = {
	medium:
		"https://cdn.jsdelivr.net/gh/rsms/inter@v3.19/docs/font-files/Inter-Medium.otf",
	bold:
		"https://cdn.jsdelivr.net/gh/rsms/inter@v3.19/docs/font-files/Inter-Bold.otf",
};

let cachedFont: Promise<ArrayBuffer> | null = null;
let cachedFontBold: Promise<ArrayBuffer> | null = null;

function fetchFont(url: string): Promise<ArrayBuffer> {
	return fetch(url).then((r) => {
		if (!r.ok) throw new Error(`Font fetch failed: ${url} ${r.status}`);
		return r.arrayBuffer();
	});
}

function getFonts() {
	if (!cachedFont) cachedFont = fetchFont(FONT_URLS.medium);
	if (!cachedFontBold) cachedFontBold = fetchFont(FONT_URLS.bold);
	return Promise.all([cachedFont, cachedFontBold]);
}

interface IdeaOgData {
	title: string;
	score: number;
	commentCount: number;
	submitterName: string;
}

async function loadIdea(id: string): Promise<IdeaOgData | null> {
	const convexUrl = import.meta.env.PUBLIC_CONVEX_URL as string | undefined;
	if (!convexUrl) return null;
	try {
		const client = new ConvexHttpClient(convexUrl);
		const result = await client.query(api.projectIdeas.getIdea, {
			id: id as Id<"projectIdea">,
		});
		if (!result) return null;
		return {
			title: result.title,
			score: result.upvoteCount - (result.downvoteCount ?? 0),
			commentCount: result.commentCount,
			submitterName: result.submitterName,
		};
	} catch {
		return null;
	}
}

export const GET: APIRoute = async ({ url }) => {
	const id = url.searchParams.get("id")?.trim() ?? "";
	if (!id) {
		return new Response("Missing id", { status: 400 });
	}

	const [idea, [interFont, interBold]] = await Promise.all([
		loadIdea(id),
		getFonts(),
	]);

	const data: IdeaOgData = idea ?? {
		title: "Idea",
		score: 0,
		commentCount: 0,
		submitterName: "Community member",
	};

	return new ImageResponse(IdeaCard(data), {
		width: WIDTH,
		height: HEIGHT,
		fonts: [
			{ name: "Inter", data: interFont, weight: 500, style: "normal" },
			{ name: "Inter", data: interBold, weight: 700, style: "normal" },
		],
		headers: {
			"Cache-Control": "public, max-age=3600, s-maxage=3600",
		},
	});
};
