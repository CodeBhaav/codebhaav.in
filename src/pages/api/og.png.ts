import type { APIRoute } from "astro";
import { ImageResponse } from "workers-og";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";
import { ReferralCard, PageCard, PAGE_OG_CONFIG } from "@/lib/og/templates";

export const prerender = false;

const WIDTH = 1200;
const HEIGHT = 630;

// Inter OTFs from rsms/inter@v3.19 (jsdelivr GH CDN). OTF works directly
// with Satori; Google Fonts only serves WOFF2 which Satori in workers-og
// rejects with "Unsupported OpenType signature wOF2".
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

async function fetchAvatar(url: string | null): Promise<string | null> {
	if (!url) return null;
	try {
		const res = await fetch(url);
		if (!res.ok) return null;
		const buf = await res.arrayBuffer();
		const contentType = res.headers.get("content-type") ?? "image/jpeg";
		const base64 = arrayBufferToBase64(buf);
		return `data:${contentType};base64,${base64}`;
	} catch {
		return null;
	}
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
	const bytes = new Uint8Array(buffer);
	let binary = "";
	for (let i = 0; i < bytes.byteLength; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

interface Referrer {
	firstName: string;
	imageUrl: string | null;
}

async function loadReferrer(code: string | null): Promise<Referrer | null> {
	if (!code) return null;
	const convexUrl = import.meta.env.PUBLIC_CONVEX_URL as string | undefined;
	if (!convexUrl) return null;
	try {
		const client = new ConvexHttpClient(convexUrl);
		const result = await client.query(api.waitlist.getReferrerByCode, {
			code,
		});
		if (!result) return null;
		return { firstName: result.firstName, imageUrl: result.imageUrl };
	} catch {
		return null;
	}
}

export const GET: APIRoute = async ({ url }) => {
	const ref = url.searchParams.get("ref")?.trim() || null;
	const pageKey =
		url.searchParams.get("page")?.trim().toLowerCase() || "home";

	const [referrer, [interFont, interBold]] = await Promise.all([
		loadReferrer(ref),
		getFonts(),
	]);

	let element: React.ReactElement;
	if (referrer) {
		const avatar = await fetchAvatar(referrer.imageUrl);
		element = ReferralCard({ firstName: referrer.firstName, avatar });
	} else {
		const config = PAGE_OG_CONFIG[pageKey] ?? PAGE_OG_CONFIG.home;
		element = PageCard(config);
	}

	return new ImageResponse(element, {
		width: WIDTH,
		height: HEIGHT,
		fonts: [
			{ name: "Inter", data: interFont, weight: 500, style: "normal" },
			{ name: "Inter", data: interBold, weight: 700, style: "normal" },
		],
		headers: {
			"Cache-Control": "public, max-age=86400, s-maxage=86400, immutable",
		},
	});
};
