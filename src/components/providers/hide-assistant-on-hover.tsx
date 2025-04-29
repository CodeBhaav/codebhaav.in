"use client"

import type { ReactNode } from "react"
import { useAssistantBot } from "@/components/providers/assistant-bot-context"

interface HideAssistantOnHoverProps {
    children: ReactNode
    className?: string
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    [key: string]: any // Allow any other props to be passed through
}

export function HideAssistantOnHover({ children, className, ...props }: HideAssistantOnHoverProps) {
    const { hideAssistant, showAssistant } = useAssistantBot()

    return (
        <div className={className} onMouseEnter={hideAssistant} onMouseLeave={showAssistant} {...props}>
            {children}
        </div>
    )
}
