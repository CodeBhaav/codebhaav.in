"use client";

import { useAssistantBot } from "@/components/providers/assistant-bot-context";
import type { ReactNode } from "react";

interface HideAssistantOnHoverProps {
	children: ReactNode;
	className?: string;
	[key: string]: unknown; // Allow any other props to be passed through
}

export function HideAssistantOnHover({
	children,
	className,
	...props
}: HideAssistantOnHoverProps) {
	const { hideAssistant, showAssistant } = useAssistantBot();

	return (
		<div
			className={className}
			onMouseEnter={hideAssistant}
			onMouseLeave={showAssistant}
			{...props}
		>
			{children}
		</div>
	);
}
