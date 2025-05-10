import { Context } from "./context";
import { Toolbox } from "./toolbox";
import { Tool, ToolInput, Message } from "./types";
import ollama from "ollama";
import chalk from "chalk";

export interface AssistantOptions {
  model: string;
  tools?: Tool[];
  debug?: boolean;
}

export class Assistant {
  private context = new Context();
  private toolbox = new Toolbox();
  private model: string;
  private debug: boolean;

  constructor(options: AssistantOptions) {
    this.model = options.model;
    this.debug = options.debug ?? false;
    options.tools?.forEach((t) => this.toolbox.register(t));
  }

  getContext(): Context {
    return this.context;
  }
  addMessage(message: Message): void {
    if (this.debug) {
      this.displayMessage(message);
    }
    this.context.add(message);
  }
  debugLogContext() {
    for (const message of this.context.get()) {
      this.displayMessage(message);
    }
  }
  private displayMessage(message: Message) {
    const toolCalls = message.tool_calls
      ? `Tool calls: ${JSON.stringify(message.tool_calls)}`
      : "";

    console.log(
      `${chalk.blue(message.role)}: ${chalk.gray(message.content)}${toolCalls}`
    );
  }

  async ask(prompt: string): Promise<{ response: string; steps?: Message[] }> {
    this.addMessage({ role: "user", content: prompt });
    let steps: Message[] = [];
    let done = false;

    while (!done) {
      const result = await ollama.chat({
        model: this.model,
        messages: this.context.get(),
        tools: this.toolbox.list().map((t) => ({
          type: "function",
          function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          },
        })),
      });

      const resMsg = result.message as Message;
      this.addMessage(resMsg);
      steps.push(resMsg);

      const calls = resMsg.tool_calls ? true : false;
      if (!calls) {
        done = true;
      } else {
        for (const call of resMsg.tool_calls!) {
          const tool = this.toolbox.get(call.function.name);
          if (!tool) throw new Error(`Tool ${call.function.name} not found`);

          console.log(`Executing tool: ${tool.name}`);

          const output = await tool.execute(call.function.arguments);

          const toolMsg: Message = {
            role: "tool",
            name: call.function.name,
            content: JSON.stringify(output),
          };
          this.addMessage(toolMsg);
          steps.push(toolMsg);
        }
      }
    }

    const last = this.context.get().slice(-1)[0];
    return {
      response: last?.content ?? "",
      steps: this.debug ? steps : undefined,
    };
  }
}
