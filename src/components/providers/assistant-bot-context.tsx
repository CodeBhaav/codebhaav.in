"use client";

import { type ReactNode, createContext, useContext, useState } from "react";

interface AssistantBotContextType {
	scale: number;
	setScale: (scale: number) => void;
	hideAssistant: () => void;
	showAssistant: () => void;
}

const AssistantBotContext = createContext<AssistantBotContextType>({
	scale: 1,
	setScale: () => {},
	hideAssistant: () => {},
	showAssistant: () => {},
});

export function useAssistantBot() {
	return useContext(AssistantBotContext);
}

export function AssistantBotProvider({ children }: { children: ReactNode }) {
	const [scale, setScale] = useState(1);

	const hideAssistant = () => setScale(0);
	const showAssistant = () => setScale(1);

	return (
		<AssistantBotContext.Provider
			value={{ scale, setScale, hideAssistant, showAssistant }}
		>
			{children}
		</AssistantBotContext.Provider>
	);
}
