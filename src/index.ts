import OpenAI from "openai";
import { tools, executeTool } from "./tools.js";

if (!process.env.DEEPSEEK_API_KEY) {
  console.error("Error: DEEPSEEK_API_KEY environment variable is not set.");
  process.exit(1);
}

const client = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: process.env.DEEPSEEK_API_KEY,
});

async function runAgent(userMessage: string): Promise<void> {
  console.log(`User: ${userMessage}\n`);

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: "You are a helpful assistant. Use tools when appropriate." },
    { role: "user", content: userMessage },
  ];

  // Agentic loop: keep running until the model produces a final text response
  while (true) {
    const response = await client.chat.completions.create({
      model: "deepseek-chat",
      messages,
      tools,
      tool_choice: "auto",
    });

    const choice = response.choices[0];
    const assistantMsg = choice.message;

    // Always append the assistant turn to keep history consistent
    messages.push(assistantMsg);

    if (choice.finish_reason === "tool_calls" && assistantMsg.tool_calls?.length) {
      // Execute every requested tool and feed results back
      for (const call of assistantMsg.tool_calls) {
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(call.function.arguments || "{}");
        } catch { /* leave args empty */ }

        const result = executeTool(call.function.name, args);
        console.log(`[tool] ${call.function.name}(${call.function.arguments}) → ${result}`);

        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: result,
        });
      }
      // Continue the loop so the model can use the tool results
    } else {
      // Final text response
      console.log(`\nAssistant: ${assistantMsg.content}`);
      break;
    }
  }
}

// Entry point
runAgent("What time is it now? Also, what is 123 * 456?").catch(console.error);
