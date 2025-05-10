# Ollama-Assistant

This is a simple wrapper around the ollama-js library to provide building blocks for building an AI-Assistant. It provides an interface for defining Tools and an automatic tool caller for the AI, to automate the process of executing tool and sending the response back to ollama. As well as context management.

## Quick start

```ts
import { Assistant } from "ollama-assistant";
import { GetEntryTool, GetDateTimeTool } from "./tools.ts"; //example. For tool definition, see below.

// define a new Assistant. Each assistant instance holds the context informations.
let assistant = new Assistant({
	model: "qwen3:1.7b", // example model using tools. Good for reasoning and small enough to run on a laptop
	debug: true, // log messages to terminal
	tools: [new GetDateTimeTool(), new GetEntryTool()], // define tools. Each tool is an instance of its class
});

(async function () {
	console.log("Assistant initialized.");
	const response = await assistant.ask(
		"Fetch me the log entry from 10 minutes ago today and explain it."
	);
	return response;
})();
```

## define tools

Tools can be defined as classes that implement the `Tool` interface.

(Example `tools.ts` file as it could be imported above)
```ts
import { Tool, ToolInput } from "ollama-assistant";

export class GetDateTimeTool implements Tool {
	name = "get_time";
	// good description is necessary to tell the AI what the tool is for
	description =
		"Get the current (actual) time and date in a specific timezone.";
	parameters = {
		type: "object",
		properties: { // define your parameters here
			timezone: {
				type: "string",
				description:
					"official TZ database name for the timezone, e.g., 'America/New_York', 'Europe/Berlin', 'Asia/Tokyo'.",
			},
		},
		required: ["timezone"],
	};

	// each tool has the execute function, that returns a Promise of type String or ToolOutput
	async execute(args: ToolInput): Promise<String> {
		try {
			const { timezone } = args;
			if (!timezone) {
				throw new Error("Timezone is required.");
			}
			return getTimeInTimezone(timezone);
		} catch (error: any) {
			return "Error getting time: " + error.message.toString();
		}
	}
}

const getTimeInTimezone = (timeZone: string) => {
	const now = new Date();
	const formatter = new Intl.DateTimeFormat("en-US", {
		timeZone: timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
	});

	return formatter.format(now);
};
```