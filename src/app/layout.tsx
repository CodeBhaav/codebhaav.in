import type React from "react";
import "@/app/globals.css";
// import { AssistantBotProvider } from "@/components/assistant-bot-context"
import { SiteHeader } from "@/components/core/site-header";
import { ThemeProvider } from "@/components/providers/theme-provider";
import type { Metadata } from "next";
import Footer from "@/components/core/footer";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({
	subsets: ["latin"],
	variable: "--font-inter",
});

export const metadata: Metadata = {
	title: "CodeBhaav - Student-led Tech Community",
	description:
		"A student-led tech community from Amravati, fostering innovation, collaboration, and purpose-driven development.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			suppressHydrationWarning
			className={cn(inter.variable, "dark")}
		>
			<body>
				{/* <AssistantBotProvider> */}
				<ThemeProvider
					attribute="class"
					defaultTheme="dark"
					enableSystem={false}
					forcedTheme="dark"
				>
					{/* Header */}
					<div className="fixed inset-x-0 top-0 z-50 bg-transparent min-h-56">
						<SiteHeader />
					</div>
					{children}
					{/* Footer */}
					<Footer />
				</ThemeProvider>
				{/* </AssistantBotProvider> */}
			</body>
		</html>
	);
}
