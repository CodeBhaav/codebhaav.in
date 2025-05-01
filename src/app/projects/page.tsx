"use client";

import { PageHeader } from "@/components/core/page-header";
import { ProjectCard } from "@/components/project-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "motion/react";
import { Search } from "lucide-react";
import { useState } from "react";
import { PageHeaderMinimal } from "@/components/core/page-header-minimal";

// Project categories
const categories = ["All", "Web", "Mobile", "AI", "Open Source", "Community"];

// Sample projects data
const projectsData: {
	id: number;
	title: string;
	description: string;
	image: string;
	tags: string[];
	category: string;
}[] = [];

export default function ProjectsPage() {
	const [selectedCategory, setSelectedCategory] = useState("All");
	const [searchQuery, setSearchQuery] = useState("");

	// Filter projects based on category and search query
	const filteredProjects = projectsData.filter((project) => {
		const matchesCategory =
			selectedCategory === "All" || project.category === selectedCategory;
		const matchesSearch =
			project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
			project.tags.some((tag) =>
				tag.toLowerCase().includes(searchQuery.toLowerCase()),
			);
		return matchesCategory && matchesSearch;
	});
	const projectsCodeSnippet = `// Our Projects
function buildProject() {
 const values = {
 openSource: true,
 withCommunity: true,
 };
 return createImpact(values);
}`;
	return (
		<div className="min-h-screen bg-background">
			<PageHeaderMinimal
				title="Our Projects"
				description="Explore the innovative projects created by the CodeBhaav community."
				size="large"
				codeSnippet={projectsCodeSnippet}
			/>
			<div className="container max-w-7xl mx-auto px-4">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
					className="my-8"
				>
					<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
						<div className="flex flex-wrap gap-2">
							{categories.map((category) => (
								<Button
									key={category}
									variant={
										selectedCategory === category ? "default" : "outline"
									}
									size="sm"
									onClick={() => setSelectedCategory(category)}
									className="rounded-full"
								>
									{category}
								</Button>
							))}
						</div>
						<div className="relative w-full md:w-64">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search projects..."
								className="pl-9"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>
					</div>

					{filteredProjects.length > 0 ? (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{filteredProjects.map((project, index) => (
								<ProjectCard
									key={project.id}
									title={project.title}
									description={project.description}
									image={project.image}
									tags={project.tags}
									delay={index * 0.1}
								/>
							))}
						</div>
					) : (
						<div className="text-center py-12">
							<p className="text-muted-foreground">
								No projects found matching your criteria.
							</p>
							<Button
								variant="link"
								onClick={() => {
									setSelectedCategory("All");
									setSearchQuery("");
								}}
							>
								Clear filters
							</Button>
						</div>
					)}
				</motion.div>

				<div className="my-12 p-8 rounded-lg border border-primary/10 backdrop-blur-sm bg-background/30 text-center">
					<h2 className="text-2xl font-bold mb-4">Have a Project Idea?</h2>
					<p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
						We're always looking for new project ideas and collaborators. If you
						have an idea or want to contribute to an existing project, get in
						touch with us!
					</p>
					<div className="flex flex-wrap justify-center gap-4">
						<Button>Submit Project Idea</Button>
						<Button variant="outline">Join a Project Team</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
