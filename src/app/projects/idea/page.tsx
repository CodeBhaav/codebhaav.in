"use client";

import { Button } from "@/components/ui/button";
import { PageHeaderMinimal } from "@/components/core/page-header-minimal";

export default function ProjectsPage() {
	return (
		<div className="min-h-screen bg-background">
			<PageHeaderMinimal
				title="New Project Ideas"
				description="Share your innovative ideas and collaborate with the community."
				size="large"
			/>
			<div className="container max-w-7xl mx-auto px-4">
				<div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
					<div className="max-w-2xl">
						<h2 className="text-2xl font-bold tracking-tight mb-4">
							🚧 Under Construction
						</h2>
						<p className="text-muted-foreground leading-relaxed mb-6">
							We're working on a new project ideas section where you can share
							your innovative ideas and collaborate with the community.
						</p>
						<p className="text-muted-foreground leading-relaxed mb-8">
							If you have any suggestions or would like to contribute, please
							reach out to us.
						</p>
						<div className="flex gap-4 justify-center">
							<Button
								variant="outline"
								onClick={() => window.open("mailto:pranav@codebhaav.in")}
							>
								Mail Us: pranav@codebhaav.in
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
