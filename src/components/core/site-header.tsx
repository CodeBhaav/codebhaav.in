"use client";

import { Menu, X } from "lucide-react";
import { AnimatePresence, motion, useScroll } from "motion/react";
// import { HideAssistantOnHover } from "./hide-assistant-on-hover"
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

// Animation variants
const overlayVariants = {
	hidden: { opacity: 0 },
	visible: { opacity: 1 },
	exit: { opacity: 0 },
};

const drawerVariants = {
	hidden: { opacity: 0, y: 100 },
	visible: {
		opacity: 1,
		y: 0,
		transition: {
			type: "spring",
			damping: 20,
			stiffness: 300,
			staggerChildren: 0.05,
		},
	},
	exit: {
		opacity: 0,
		y: 100,
		transition: { duration: 0.2 },
	},
};

const drawerMenuContainerVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.05,
			delayChildren: 0.1,
		},
	},
};

const drawerMenuVariants = {
	hidden: { opacity: 0, y: 10 },
	visible: {
		opacity: 1,
		y: 0,
		transition: {
			type: "spring",
			stiffness: 400,
			damping: 25,
		},
	},
};

const navItemVariants = {
	hidden: { opacity: 0, y: -10 },
	visible: {
		opacity: 1,
		y: 0,
		transition: {
			type: "spring",
			stiffness: 300,
			damping: 20,
		},
	},
};

const INITIAL_WIDTH = "100%";
const MAX_WIDTH = "90%";

export function SiteHeader() {
	const { scrollY } = useScroll();
	const [hasScrolled, setHasScrolled] = useState(false);
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	useEffect(() => {
		const unsubscribe = scrollY.on("change", (latest) => {
			setHasScrolled(latest > 10);
		});
		return unsubscribe;
	}, [scrollY]);

	const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
	const handleOverlayClick = () => setIsMenuOpen(false);

	const navLinks = [
		{ name: "Home", href: "/" },
		{ name: "Mission", href: "/mission" },
		{ name: "Projects", href: "/projects" },
		{ name: "Contact", href: "/contact" },
	];

	return (
		<header
			className={`sticky z-50 mx-4 flex justify-center transition-all duration-300 md:mx-0 ${hasScrolled ? "top-6" : "top-4 mx-0"}`}
		>
			<motion.div
				initial={{ width: INITIAL_WIDTH }}
				animate={{ width: hasScrolled ? MAX_WIDTH : INITIAL_WIDTH }}
				transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
			>
				<div
					className={`mx-auto max-w-7xl rounded-2xl transition-all duration-300 xl:px-0 border-none ${
						hasScrolled
							? "px-2 border border-zinc-800/40 backdrop-blur-lg bg-gradient-to-br from-teal-500/5 to-emerald-500/5 shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
							: "shadow-none px-7"
					}`}
				>
					<div className="flex h-16 items-center justify-between p-4">
						<motion.div
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{
								duration: 0.5,
								type: "spring",
								stiffness: 200,
								damping: 20,
							}}
						>
							{/* <HideAssistantOnHover> */}
							<Link href="/" className="flex items-center gap-1 group">
								<div className="relative overflow-hidden rounded-full size-10 flex items-center justify-center">
									<Image
										src="/logo.svg"
										alt="CodeBhaav Logo"
										width={28}
										height={28}
										className="rounded-full transition-transform duration-300 group-hover:scale-110"
									/>
								</div>
								<span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 transition-all duration-300 group-hover:from-cyan-300 group-hover:via-blue-400 group-hover:to-purple-500">
									CodeBhaav
								</span>
							</Link>
							{/* </HideAssistantOnHover> */}
						</motion.div>

						<motion.nav
							className="hidden md:flex items-center gap-8"
							initial="hidden"
							animate="visible"
							variants={{
								hidden: {},
								visible: {
									transition: {
										staggerChildren: 0.1,
										delayChildren: 0.2,
									},
								},
							}}
						>
							{navLinks.map((link) => (
								<motion.div key={link.name} variants={navItemVariants}>
									<Link
										href={link.href}
										className="text-sm font-medium text-zinc-300 hover:text-cyan-400 transition-colors relative group"
									>
										{link.name}
										<span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300 group-hover:w-full" />
									</Link>
								</motion.div>
							))}
						</motion.nav>

						<motion.div
							className="flex items-center gap-4"
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{
								duration: 0.5,
								type: "spring",
								stiffness: 200,
								damping: 20,
							}}
						>
							{/* <HideAssistantOnHover> */}
							<Link href="/waitlist">
								<motion.button
									className="hidden md:flex items-center justify-center h-10 px-6 text-sm font-medium rounded-full text-white bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:from-cyan-400 hover:via-blue-400 hover:to-purple-500 shadow-lg shadow-blue-500/20 transition-all duration-300"
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.98 }}
								>
									Join Waitlist
								</motion.button>
							</Link>
							{/* </HideAssistantOnHover> */}

							<motion.button
								className="md:hidden border border-zinc-700 h-9 w-9 rounded-full cursor-pointer flex items-center justify-center bg-zinc-800/50 backdrop-blur-sm"
								onClick={toggleMenu}
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
							>
								{isMenuOpen ? (
									<X className="h-4 w-4" />
								) : (
									<Menu className="h-4 w-4" />
								)}
							</motion.button>
						</motion.div>
					</div>
				</div>
			</motion.div>

			{/* Mobile menu */}
			<AnimatePresence>
				{isMenuOpen && (
					<>
						<motion.div
							className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
							initial="hidden"
							animate="visible"
							exit="exit"
							variants={overlayVariants}
							transition={{ duration: 0.3 }}
							onClick={handleOverlayClick}
						/>

						<motion.div
							className="fixed inset-x-0 w-[95%] mx-auto bottom-4 bg-zinc-900 border border-zinc-800/50 p-5 rounded-2xl shadow-2xl z-50 overflow-hidden"
							initial="hidden"
							animate="visible"
							exit="exit"
							variants={drawerVariants}
						>
							<div className="flex flex-col gap-5">
								<div className="flex items-center justify-between">
									<Link
										href="/"
										className="flex items-center gap-1 group"
										onClick={() => setIsMenuOpen(false)}
									>
										<div className="relative overflow-hidden rounded-full size-10 flex items-center justify-center">
											<Image
												src="/logo.svg"
												alt="CodeBhaav Logo"
												width={28}
												height={28}
												className="rounded-full transition-transform duration-300 group-hover:scale-110"
											/>
										</div>
										<span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">
											CodeBhaav
										</span>
									</Link>
									<motion.button
										onClick={toggleMenu}
										className="border border-zinc-700 rounded-full p-2 cursor-pointer bg-zinc-800/50"
										whileHover={{ scale: 1.05 }}
										whileTap={{ scale: 0.95 }}
									>
										<X className="h-4 w-4" />
									</motion.button>
								</div>

								<motion.ul
									className="flex flex-col gap-1 mb-4"
									variants={drawerMenuContainerVariants}
								>
									{navLinks.map((link) => (
										<motion.li
											key={link.name}
											variants={drawerMenuVariants}
											className="overflow-hidden"
										>
											<Link
												href={link.href}
												onClick={() => setIsMenuOpen(false)}
												className="flex items-center p-3 rounded-md hover:bg-zinc-800/50 overflow-hidden text-zinc-300 hover:text-cyan-400 transition-all duration-200"
											>
												{link.name}
											</Link>
										</motion.li>
									))}
								</motion.ul>

								<motion.div
									className="flex flex-col gap-2"
									variants={drawerMenuVariants}
								>
									<Link
										href="/waitlist"
										className="flex items-center justify-center h-12 px-6 text-sm font-medium rounded-xl text-white bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:from-cyan-400 hover:via-blue-400 hover:to-purple-500 shadow-lg shadow-blue-500/20 transition-all duration-300 active:scale-95"
										onClick={() => setIsMenuOpen(false)}
									>
										Join Waitlist
									</Link>
								</motion.div>
							</div>
						</motion.div>
					</>
				)}
			</AnimatePresence>
		</header>
	);
}
