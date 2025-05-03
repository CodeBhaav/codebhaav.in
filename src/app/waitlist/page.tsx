export const runtime = "edge";
import { PageHeaderMinimal } from "@/components/core/page-header-minimal";
import WaitlitForm from "./_form";
import type { Metadata } from "next";
import { db } from "@/db";
import { count, lt } from "drizzle-orm";
import { waitlist } from "@/db/schema";

export const dynamic = "force-dynamic"; // Force dynamic rendering to always show the latest waitlist count
export const revalidate = 0; // Disable revalidation for this page
export const metadata: Metadata = {
	title: "Join the Waitlist",
	description:
		"Join the waitlist to be among the first to join our community of self-taught developers.",
	openGraph: {
		title: "Join the Waitlist",
		description:
			"Join the waitlist to be among the first to join our community of self-taught developers.",
		url: `${process.env.NEXT_PUBLIC_BASE_URL}/waitlist`,
	},
	twitter: {
		title: "Join the Waitlist",
		description:
			"Join the waitlist to be among the first to join our community of self-taught developers.",
		card: "summary_large_image",
	},
	keywords: [
		"waitlist",
		"join waitlist",
		"self-taught developers",
		"community",
	],
	authors: [
		{
			name: "CodeBhaav",
			url: "https://codebhaav.in",
		},
	],
	creator: "CodeBhaav",
	applicationName: "CodeBhaav",
	icons: {
		icon: "/favicon.ico",
		shortcut: "/favicon.ico",
		apple: "/favicon.ico",
	},
	robots: {
		index: true,
		follow: true,
	},
	metadataBase: new URL(
		process.env.NEXT_PUBLIC_BASE_URL || "https://codebhaav.in",
	),
	appleWebApp: {
		title: "CodeBhaav",
		statusBarStyle: "default",
	},
};

export default async function WaitlistPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
	const { ref } = await searchParams;
	if (ref) {
		const existingUser = await db.query.waitlist.findFirst({
			where: (waitlist, { eq }) => eq(waitlist.referralCode, ref),
			columns: {
				name: true,
				email: true,
				referralCode: true,
				createdAt: true,
			},
		});
		if (existingUser) {
			const position = await db
				.select({ count: count() })
				.from(waitlist)
				.where(lt(waitlist.createdAt, existingUser.createdAt))
				.execute()
				.then((result) => result[0]?.count ?? 0);
			return (
				<div className="min-h-screen">
					<PageHeaderMinimal
						size="large"
						title="Join the Waitlist"
						description="Be among the first to join our community of self-taught developers."
					/>
					<div className="container px-4 py-16 md:py-24">
						<div className="max-w-4xl mx-auto ">
							<div className=" relative rounded-2xl backdrop-blur-sm bg-background/30 border border-primary/10  p-6 mb-8 ">
								<div className="flex flex-col items-center">
									{/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
									<svg
										xmlns="http://www.w3.org/2000/svg"
										className="h-12 w-12 text-primary mb-4"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
										/>
									</svg>
									<h3 className="text-xl font-bold text-primary mb-2">
										Personal Referral
									</h3>
									<p className="text-secondary-foreground text-center">
										You have been referred by{" "}
										<span className="font-semibold text-primary">
											{existingUser.name}
										</span>
									</p>
									<p className="text-sm text-secondary-foreground mt-1">
										{existingUser.email}
									</p>
								</div>
							</div>
							<WaitlitForm
								waitlistCount={position + 1}
								referredBy={existingUser.referralCode}
							/>
						</div>
					</div>
				</div>
			);
		}
	}
	// If no referral code is provided or the code is invalid, show the default waitlist form
	const waitlistCount = await db.$count(waitlist);
	return (
		<div className="min-h-screen">
			<PageHeaderMinimal
				size="large"
				title="Join the Waitlist"
				description="Be among the first to join our community of self-taught developers."
			/>
			<div className="container px-4 py-16 md:py-24">
				<div className="max-w-4xl mx-auto">
					<WaitlitForm waitlistCount={waitlistCount} />
				</div>
			</div>
		</div>
	);
}
