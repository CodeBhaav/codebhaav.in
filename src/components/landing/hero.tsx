"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Code, Rocket, Sparkles, Users } from "lucide-react";
import {
	motion,
	useMotionValue,
	useScroll,
	useSpring,
	useTransform,
} from "motion/react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { HideAssistantOnHover } from "../providers/hide-assistant-on-hover";
import { AuroraText } from "../magicui/aurora-text";
import { LineShadowText } from "../magicui/line-shadow-text";

export function HeroV2({ waitlistCount }: { waitlistCount: number }) {
	const targetRef = useRef<HTMLDivElement>(null);
	const { scrollYProgress } = useScroll({
		target: targetRef,
		offset: ["start start", "end start"],
	});

	const y = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
	const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

	const mouseX = useMotionValue(0);
	const mouseY = useMotionValue(0);

	const smoothMouseX = useSpring(mouseX, { damping: 50, stiffness: 400 });
	const smoothMouseY = useSpring(mouseY, { damping: 50, stiffness: 400 });

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			const { clientX, clientY } = e;
			const windowWidth = window.innerWidth;
			const windowHeight = window.innerHeight;

			// Calculate mouse position as percentage of window
			const x = (clientX / windowWidth - 0.5) * 2; // -1 to 1
			const y = (clientY / windowHeight - 0.5) * 2; // -1 to 1

			mouseX.set(x);
			mouseY.set(y);
		};

		window.addEventListener("mousemove", handleMouseMove);
		return () => window.removeEventListener("mousemove", handleMouseMove);
	}, [mouseX, mouseY]);

	const features = [
		{
			icon: <Code className="h-5 w-5" />,
			title: "Learn by Building",
			description:
				"Focus on creating real projects rather than just consuming tutorials",
			delay: 0.6,
			color: "from-violet-500/20 to-purple-500/20",
		},
		{
			icon: <Users className="h-5 w-5" />,
			title: "Community Support",
			description: "Connect with like-minded developers who share your journey",
			delay: 0.8,
			color: "from-blue-500/20 to-indigo-500/20",
		},
		{
			icon: <Rocket className="h-5 w-5" />,
			title: "Purpose-Driven",
			description:
				"Build technology that solves real problems and creates impact",
			delay: 1.0,
			color: "from-cyan-500/20 to-teal-500/20",
		},
	];

	const codeSnippet1 = `function buildWithPurpose() {
  const impact = learn() + create();
  return impact * community;
}`;

	const codeSnippet2 = `// CodeBhaav Community
import { learn, build, share } from 'codebhaav';

const journey = async () => {
  await learn();
  build();
  share();
};`;

	return (
		<div
			ref={targetRef}
			className="relative min-h-screen flex items-center justify-center overflow-hidden"
		>
			{/* Animated background elements */}
			<div className="absolute inset-0 overflow-hidden">
				<motion.div
					className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-gradient-to-r from-violet-500/10 to-purple-500/10 blur-3xl"
					style={{
						x: useTransform(smoothMouseX, [-1, 1], [-20, 20]),
						y: useTransform(smoothMouseY, [-1, 1], [-20, 20]),
					}}
				/>
				<motion.div
					className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-gradient-to-r from-blue-500/10 to-indigo-500/10 blur-3xl"
					style={{
						x: useTransform(smoothMouseX, [-1, 1], [20, -20]),
						y: useTransform(smoothMouseY, [-1, 1], [20, -20]),
					}}
				/>
				<motion.div
					className="absolute top-2/3 right-1/3 w-64 h-64 rounded-full bg-gradient-to-r from-cyan-500/10 to-teal-500/10 blur-3xl"
					style={{
						x: useTransform(smoothMouseX, [-1, 1], [-15, 15]),
						y: useTransform(smoothMouseY, [-1, 1], [15, -15]),
					}}
				/>
			</div>

			{/* Floating code snippets */}
			<motion.div
				className="absolute top-1/4 right-[15%] w-max rounded-lg border border-zinc-700/50 bg-zinc-900/80 backdrop-blur-sm shadow-lg hidden lg:block overflow-hidden"
				initial={{ opacity: 0, y: 20, rotate: 5 }}
				animate={{ opacity: 0.9, y: 0, rotate: 5 }}
				transition={{ duration: 0.8, delay: 1.2 }}
				style={{
					y: useTransform(smoothMouseY, [-1, 1], [-10, 10]),
					x: useTransform(smoothMouseX, [-1, 1], [-5, 5]),
					rotate: useTransform(smoothMouseX, [-1, 1], [3, 7]),
				}}
			>
				<SyntaxHighlighter
					language="javascript"
					style={atomDark}
					customStyle={{
						margin: 0,
						padding: "1rem",
						background: "transparent",
						fontSize: "0.75rem",
						maxHeight: "150px",
						overflowY: "auto",
					}}
				>
					{codeSnippet1}
				</SyntaxHighlighter>
			</motion.div>

			<motion.div
				className="absolute bottom-1/4 left-[15%] w-max rounded-lg border border-zinc-700/50 bg-zinc-900/80 backdrop-blur-sm shadow-lg hidden lg:block overflow-hidden"
				initial={{ opacity: 0, y: 20, rotate: -5 }}
				animate={{ opacity: 0.9, y: 0, rotate: -5 }}
				transition={{ duration: 0.8, delay: 1.4 }}
				style={{
					y: useTransform(smoothMouseY, [-1, 1], [10, -10]),
					x: useTransform(smoothMouseX, [-1, 1], [5, -5]),
					rotate: useTransform(smoothMouseX, [-1, 1], [-7, -3]),
				}}
			>
				<SyntaxHighlighter
					language="javascript"
					style={atomDark}
					customStyle={{
						margin: 0,
						padding: "1rem",
						background: "transparent",
						fontSize: "0.75rem",
						maxHeight: "150px",
						overflowY: "auto",
					}}
				>
					{codeSnippet2}
				</SyntaxHighlighter>
			</motion.div>

			<motion.div
				style={{ y, opacity }}
				className="container relative z-10 px-4 py-32 md:py-40"
			>
				<div className="max-w-5xl mx-auto">
					<div className="text-center mb-12">
						<motion.div
							initial={{ opacity: 0, scale: 0.9 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ duration: 0.5 }}
							className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-800/80 backdrop-blur-sm border border-zinc-700/50 mb-4"
						>
							<Sparkles className="h-4 w-4 text-cyan-400" />
							<span className="text-sm font-medium text-cyan-400">
								Student-led Tech Community from Amravati
							</span>
						</motion.div>

						<motion.h1
							className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.8, delay: 0.2 }}
						>
							Code with{" "}
							<LineShadowText
								className="text-balance text-4xl font-semibold leading-none tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl text-cyan-400 italic"
								shadowColor="white"
							>
								Bhaav
							</LineShadowText>
							.
							<br />
							Build with <AuroraText>Purpose</AuroraText>.
						</motion.h1>

						<motion.p
							className="text-lg md:text-xl mb-8 max-w-2xl mx-auto text-zinc-400"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.8, delay: 0.4 }}
						>
							A community for self-taught developers to learn, build, and grow
							together. We focus on practical skills, real-world projects, and
							authentic connections.
						</motion.p>

						<motion.div
							className="flex flex-col sm:flex-row gap-4 justify-center"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, delay: 0.5 }}
						>
							<HideAssistantOnHover>
								<Link href="/waitlist">
									<Button
										size="lg"
										className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 group"
									>
										Join the Waitlist
										<span className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-2 ">
											🚀
										</span>
									</Button>
								</Link>
							</HideAssistantOnHover>

							<HideAssistantOnHover>
								<Link href="/mission">
									<Button
										size="lg"
										variant="outline"
										className="border-zinc-700 bg-zinc-900/50"
									>
										Our Mission
									</Button>
								</Link>
							</HideAssistantOnHover>
						</motion.div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
						{features.map((feature, index) => (
							<motion.div
								key={index}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: feature.delay }}
								className="relative overflow-hidden rounded-lg backdrop-blur-sm bg-zinc-900/50 border border-zinc-800 p-6 hover:border-zinc-700 transition-colors"
							>
								<div
									className={`absolute inset-0 bg-gradient-to-br ${feature.color} z-0`}
								/>
								<div className="relative z-10">
									<div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
										{feature.icon}
									</div>
									<h3 className="text-lg font-bold mb-2">{feature.title}</h3>
									<p className="text-zinc-400">{feature.description}</p>
								</div>
							</motion.div>
						))}
					</div>

					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 1.2 }}
						className="flex justify-center mt-12"
					>
						<Link
							className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 text-sm text-zinc-400"
							href="/waitlist"
						>
							<span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
							<span>{waitlistCount} people on the waitlist</span>
						</Link>
					</motion.div>
				</div>
			</motion.div>

			<motion.div
				className="absolute bottom-10 left-1/2 -translate-x-1/2"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 1, delay: 1.5 }}
			>
				<motion.div
					animate={{ y: [0, 10, 0] }}
					transition={{
						duration: 2,
						repeat: Number.POSITIVE_INFINITY,
						repeatType: "reverse",
					}}
				>
					<a
						href="#about"
						className="flex flex-col items-center text-sm text-zinc-500"
					>
						<span className="mb-2">Scroll to explore</span>
						{/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
						<svg
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M12 5V19M12 19L5 12M12 19L19 12"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					</a>
				</motion.div>
			</motion.div>
		</div>
	);
}
