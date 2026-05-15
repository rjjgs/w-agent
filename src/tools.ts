import type OpenAI from "openai";

// --- Tool definitions (schema) ---
export const tools: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_current_time",
      description: "Return the current UTC date and time.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "calculator",
      description: "Evaluate a basic arithmetic expression.",
      parameters: {
        type: "object",
        properties: {
          expression: {
            type: "string",
            description: "Math expression to evaluate, e.g. \"3 * (2 + 5)\"",
          },
        },
        required: ["expression"],
      },
    },
  },
];

// --- Tool implementations ---
export function executeTool(
  name: string,
  args: Record<string, unknown>
): string {
  switch (name) {
    case "get_current_time":
      return new Date().toUTCString();

    case "calculator": {
      const expr = String(args.expression ?? "");
      // Only allow safe characters to avoid arbitrary code execution
      if (!/^[\d+\-*/().\s]+$/.test(expr)) {
        return "Error: invalid characters in expression";
      }
      try {
        // eslint-disable-next-line no-new-func
        return String(Function(`"use strict"; return (${expr})`)());
      } catch {
        return "Error: could not evaluate expression";
      }
    }

    default:
      return `Error: unknown tool "${name}"`;
  }
}
