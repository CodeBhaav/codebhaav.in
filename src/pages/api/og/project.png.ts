import type { APIRoute } from "astro";
import { ImageResponse } from "workers-og";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { ProjectCard } from "@/lib/og/templates";

export const prerender = false;

const WIDTH = 1200;
const HEIGHT = 630;

// Reuse Inter OTFs (Satori in workers-og rejects WOFF2). Kept in lockstep
// with /api/og.png.
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

interface ProjectOgData {
	title: string;
	status: "open" | "building" | "shipped";
	techStack: string[];
	interestCount: number;
	commentCount: number;
	originatorName: string | null;
}

async function loadProject(slug: string): Promise<ProjectOgData | null> {
	const convexUrl = import.meta.env.PUBLIC_CONVEX_URL as string | undefined;
	if (!convexUrl) return null;
	try {
		const client = new ConvexHttpClient(convexUrl);
		const result = await client.query(api.projects.getProjectBySlug, { slug });
		if (!result) return null;
		return {
			title: result.title,
			status: result.status,
			techStack: result.techStack,
			interestCount: result.interestCount,
			commentCount: result.commentCount,
			originatorName: result.originatorName,
		};
	} catch {
		return null;
	}
}

export const GET: APIRoute = async ({ url }) => {
	const slug = url.searchParams.get("slug")?.trim() ?? "";
	if (!slug) {
		return new Response("Missing slug", { status: 400 });
	}

	const [project, [interFont, interBold]] = await Promise.all([
		loadProject(slug),
		getFonts(),
	]);

	const data: ProjectOgData = project ?? {
		title: "Project",
		status: "open",
		techStack: [],
		interestCount: 0,
		commentCount: 0,
		originatorName: null,
	};

	return new ImageResponse(ProjectCard(data), {
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
