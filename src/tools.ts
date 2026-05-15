import type Anthropic from "@anthropic-ai/sdk";

export const tools: Anthropic.Tool[] = [
  {
    name: "get_weather",
    description: "Get the current weather for a location",
    input_schema: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "The city and country, e.g. 'Tokyo, Japan'",
        },
      },
      required: ["location"],
    },
  },
  {
    name: "calculate",
    description: "Evaluate a mathematical expression",
    input_schema: {
      type: "object",
      properties: {
        expression: {
          type: "string",
          description: "The math expression to evaluate, e.g. '2 + 3 * 4'",
        },
      },
      required: ["expression"],
    },
  },
];

export function executeTool(
  name: string,
  input: Record<string, unknown>
): string {
  switch (name) {
    case "get_weather": {
      const location = input.location as string;
      return JSON.stringify({
        location,
        temperature: "22°C",
        condition: "Sunny",
      });
    }
    case "calculate": {
      const expression = input.expression as string;
      try {
        const result = Function(`"use strict"; return (${expression})`)();
        return String(result);
      } catch {
        return "Error: invalid expression";
      }
    }
    default:
      return `Unknown tool: ${name}`;
  }
}
