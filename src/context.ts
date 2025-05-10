import { Message } from "./types";

export class Context {
	private messages: Message[] = [];

	add(...msgs: Message[]): void {
		this.messages.push(...msgs);
	}

	get(): Message[] {
		return this.messages;
	}
}
