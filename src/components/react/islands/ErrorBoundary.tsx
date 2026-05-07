import { Component, type ReactNode } from "react";

interface Props {
	children: ReactNode;
	name?: string;
}

interface State {
	error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { error: null };
	}

	static getDerivedStateFromError(error: Error): State {
		return { error };
	}

	componentDidCatch(error: Error) {
		console.error(`[${this.props.name ?? "Island"}] Error:`, error);
	}

	render() {
		if (this.state.error) {
			return (
				<div style={{ padding: "16px", border: "1px solid #EF4444", borderRadius: "8px", backgroundColor: "rgba(239,68,68,0.1)" }}>
					<p style={{ color: "#EF4444", fontSize: "14px", fontWeight: 500 }}>
						Something went wrong{this.props.name ? ` in ${this.props.name}` : ""}
					</p>
					<p style={{ color: "#71717A", fontSize: "12px", marginTop: "4px", fontFamily: "monospace" }}>
						{this.state.error.message}
					</p>
				</div>
			);
		}
		return this.props.children;
	}
}
