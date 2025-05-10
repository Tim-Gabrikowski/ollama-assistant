export interface ToolInput {
	[key: string]: any;
}

export interface ToolOutput {
	[key: string]: any;
}

export interface Tool {
	name: string;
	description: string;
	parameters: Record<string, any>;
	execute: (args: ToolInput) => Promise<ToolOutput | String>;
}

export interface ToolCall {
	function: {
		name: string;
		arguments: {
			[key: string]: any;
		};
	};
}
export interface Message {
	role: "user" | "assistant" | "tool" | "system" | "function" | "control";
	content: string;
	name?: string;
	tool_calls?: ToolCall[];
}
