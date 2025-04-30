"use client";

import { motion } from "motion/react";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { Github, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProjectCardProps {
	title: string;
	description: string;
	image: string;
	tags: string[];
	delay?: number;
}

export function ProjectCard({
	title,
	description,
	image,
	tags,
	delay = 0,
}: ProjectCardProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 50 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: "-100px" }}
			transition={{ duration: 0.5, delay }}
		>
			<motion.div
				whileHover={{ y: -10 }}
				transition={{ type: "spring", damping: 25, stiffness: 300, mass: 0.5 }}
			>
				<Card className="overflow-hidden backdrop-blur-sm bg-background/30 border border-primary/10 h-full">
					<div className="relative overflow-hidden aspect-video">
						<Image
							src={image || "/placeholder.svg"}
							alt={title}
							fill
							className="object-cover transition-transform duration-500 hover:scale-110"
						/>
						<div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-0 hover:opacity-60 transition-opacity duration-300 flex items-end p-4">
							<div className="flex gap-2">
								<Button
									size="icon"
									variant="secondary"
									className="rounded-full w-8 h-8"
								>
									<Github className="h-4 w-4" />
								</Button>
								<Button
									size="icon"
									variant="secondary"
									className="rounded-full w-8 h-8"
								>
									<ExternalLink className="h-4 w-4" />
								</Button>
							</div>
						</div>
					</div>
					<div className="p-6">
						<h3 className="text-xl font-bold mb-2">{title}</h3>
						<p className="text-muted-foreground mb-4">{description}</p>
						<div className="flex flex-wrap gap-2">
							{tags.map((tag, index) => (
								<span
									key={index}
									className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary"
								>
									{tag}
								</span>
							))}
						</div>
					</div>
				</Card>
			</motion.div>
		</motion.div>
	);
}
