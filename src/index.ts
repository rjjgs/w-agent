import Anthropic from "@anthropic-ai/sdk";
import { tools, executeTool } from "./tools.js";

const client = new Anthropic({
  baseURL:
    process.env.ANTHROPIC_BASE_URL ?? "https://api.deepseek.com/anthropic",
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = "deepseek-v4-pro";

async function runAgent(userMessage: string): Promise<void> {
  console.log(`User: ${userMessage}\n`);

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userMessage },
  ];

  while (true) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system:
        "You are a helpful assistant with access to tools. Use them when appropriate.",
      tools,
      messages,
    });

    if (response.stop_reason === "end_turn") {
      for (const block of response.content) {
        if (block.type === "text") {
          console.log(`Assistant: ${block.text}`);
        }
      }
      break;
    }

    if (response.stop_reason === "tool_use") {
      messages.push({ role: "assistant", content: response.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type === "tool_use") {
          console.log(`[Tool call] ${block.name}(${JSON.stringify(block.input)})`);
          const result = executeTool(
            block.name,
            block.input as Record<string, unknown>
          );
          console.log(`[Tool result] ${result}`);
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: result,
          });
        }
      }

      messages.push({ role: "user", content: toolResults });
      continue;
    }

    break;
  }
}

await runAgent("What's the weather in Tokyo? Also, what is 17 * 43?");
