import { useEffect, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { siteConfig } from "@/lib/site-config";
import { Button } from "@/components/react/ui/button";

interface NavbarProps {
	isSignedIn: boolean;
	isAdmin: boolean;
	/**
	 * Optional slot rendered before the CTA in the right-hand cluster.
	 * Used for the notification bell on signed-in pages. The Navbar itself
	 * stays auth-free; the slot brings its own Clerk + Convex providers.
	 */
	rightSlot?: ReactNode;
}

function HamburgerButton({
	isOpen,
	onClick,
}: {
	isOpen: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="md:hidden relative z-50 flex size-9 items-center justify-center rounded-button border border-border bg-background transition-colors hover:bg-surface"
			aria-label="Toggle menu"
		>
			<div className="relative size-5 flex items-center justify-center">
				<motion.span
					className="absolute h-0.5 w-4 bg-foreground"
					initial={false}
					animate={isOpen ? { rotate: 45, y: 0 } : { rotate: 0, y: -4 }}
					transition={{ duration: 0.25, ease: "easeInOut" }}
				/>
				<motion.span
					className="absolute h-0.5 w-4 bg-foreground"
					initial={false}
					animate={isOpen ? { rotate: -45, y: 0 } : { rotate: 0, y: 4 }}
					transition={{ duration: 0.25, ease: "easeInOut" }}
				/>
			</div>
		</button>
	);
}

function DesktopNav() {
	return (
		<nav className="hidden md:flex items-center gap-1">
			{siteConfig.nav.links.map((link) => (
				<a
					key={link.id}
					href={link.href}
					className="inline-flex h-9 items-center rounded-button px-3 text-sm font-medium text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
				>
					{link.name}
				</a>
			))}
		</nav>
	);
}

function MobileNav({
	isOpen,
	onClose,
	signedIn,
	isAdmin,
}: {
	isOpen: boolean;
	onClose: () => void;
	signedIn: boolean;
	isAdmin: boolean;
}) {
	const ctaHref = signedIn ? "/dashboard" : siteConfig.ctaHref;
	const ctaText = signedIn ? "Go to Dashboard" : siteConfig.cta;
	return (
		<AnimatePresence>
			{isOpen && (
				<>
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						onClick={onClose}
						className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
						style={{ top: "64px" }}
					/>
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="fixed top-16 left-0 right-0 bottom-0 z-50 w-full bg-background md:hidden overflow-y-auto"
					>
						<div className="flex h-full flex-col">
							<nav className="flex-1 px-4 sm:px-6 py-8 pb-32">
								<div className="flex flex-col gap-2">
									{siteConfig.nav.links.map((link, index) => (
										<motion.a
											key={link.id}
											href={link.href}
											onClick={onClose}
											initial={{
												opacity: 0,
												y: -20,
												filter: "blur(8px)",
											}}
											animate={{
												opacity: 1,
												y: 0,
												filter: "blur(0px)",
											}}
											transition={{
												delay: index * 0.06,
												duration: 0.5,
												ease: [0.16, 1, 0.3, 1],
											}}
											className="block py-3 text-2xl font-semibold tracking-tight text-text-primary transition-colors hover:text-accent"
										>
											{link.name}
										</motion.a>
									))}
									{isAdmin && (
										<motion.a
											href="/admin"
											onClick={onClose}
											initial={{
												opacity: 0,
												y: -20,
												filter: "blur(8px)",
											}}
											animate={{
												opacity: 1,
												y: 0,
												filter: "blur(0px)",
											}}
											transition={{
												delay: siteConfig.nav.links.length * 0.06,
												duration: 0.5,
												ease: [0.16, 1, 0.3, 1],
											}}
											className="block py-3 font-mono text-base uppercase tracking-widest text-accent transition-colors hover:text-accent-hover"
										>
											Admin →
										</motion.a>
									)}
								</div>
							</nav>
							<div className="sticky bottom-0 w-full p-6 bg-background border-t border-border">
								<motion.div
									initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
									animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
									transition={{
										delay: 0.1,
										duration: 0.5,
										ease: [0.16, 1, 0.3, 1],
									}}
								>
									<Button asChild className="w-full" size="lg">
										<a href={ctaHref} onClick={onClose}>
											{ctaText}
										</a>
									</Button>
								</motion.div>
							</div>
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}

export function Navbar({ isSignedIn, isAdmin, rightSlot }: NavbarProps) {
	const [isVisible, setIsVisible] = useState(true);
	const [lastScrollY, setLastScrollY] = useState(0);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const signedIn = isSignedIn;

	useEffect(() => {
		const handleScroll = () => {
			const currentScrollY = window.scrollY;
			if (currentScrollY < 10) {
				setIsVisible(true);
			} else if (currentScrollY > lastScrollY) {
				setIsVisible(false);
			} else if (currentScrollY < lastScrollY) {
				setIsVisible(true);
			}
			setLastScrollY(currentScrollY);
		};
		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, [lastScrollY]);

	useEffect(() => {
		document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
		return () => {
			document.body.style.overflow = "";
		};
	}, [isMobileMenuOpen]);

	const ctaHref = signedIn ? "/dashboard" : siteConfig.ctaHref;
	const ctaText = signedIn ? "Dashboard" : siteConfig.cta;

	return (
		<>
			<motion.header
				initial={{ y: 0 }}
				animate={{ y: isVisible ? 0 : -100 }}
				transition={{ duration: 0.3, ease: "easeInOut" }}
				className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm"
			>
				<div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
					<a
						href="/"
						className="flex items-center gap-2 text-base font-semibold tracking-tight text-text-primary"
					>
						<img
							src="/logo-mark.svg"
							alt=""
							width={28}
							height={28}
							className="size-7"
						/>
						CodeBhaav
					</a>

					<DesktopNav />

					<div className="flex items-center gap-2">
						{rightSlot}
						{isAdmin && (
							<a
								href="/admin"
								className="hidden md:inline-flex h-9 items-center rounded-button border border-[#f59e0b]/40 bg-[#241906] px-3 font-mono text-[11px] font-semibold uppercase tracking-widest text-accent transition-colors hover:bg-[#3a2807]"
							>
								Admin
							</a>
						)}
						<Button asChild size="sm" className="hidden md:inline-flex">
							<a href={ctaHref}>{ctaText}</a>
						</Button>
						<HamburgerButton
							isOpen={isMobileMenuOpen}
							onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
						/>
					</div>
				</div>
			</motion.header>

			<MobileNav
				isOpen={isMobileMenuOpen}
				onClose={() => setIsMobileMenuOpen(false)}
				signedIn={signedIn}
				isAdmin={isAdmin}
			/>
		</>
	);
}
