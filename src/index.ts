import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

async function main() {
  // 1. Create environment (reusable container config)
  const environment = await client.beta.environments.create({
    name: "w-agent-env",
    config: {
      type: "cloud",
      networking: { type: "unrestricted" },
    },
  });
  console.log("Environment:", environment.id);

  // 2. Create agent (reusable, versioned config)
  const agent = await client.beta.agents.create({
    name: "W Agent",
    model: "claude-opus-4-7",
    system: "You are a helpful assistant.",
    tools: [{ type: "agent_toolset_20260401", default_config: { enabled: true } }],
  });
  console.log("Agent:", agent.id, "version:", agent.version);

  // 3. Start a session
  const session = await client.beta.sessions.create({
    agent: { type: "agent", id: agent.id, version: agent.version },
    environment_id: environment.id,
    title: "Hello session",
  });
  console.log("Session:", session.id);
  console.log(`Watch: https://platform.claude.com/workspaces/default/sessions/${session.id}`);

  // 4. Open stream first, then send message concurrently
  const stream = await client.beta.sessions.events.stream(session.id);

  await client.beta.sessions.events.send(session.id, {
    events: [{
      type: "user.message",
      content: [{ type: "text", text: "Say hello and tell me what tools you have." }],
    }],
  });

  // 5. Process events until idle or terminated
  for await (const event of stream) {
    if (event.type === "agent.message") {
      for (const block of event.content) {
        if (block.type === "text") process.stdout.write(block.text);
      }
    } else if (event.type === "session.status_idle") {
      if (event.stop_reason?.type !== "requires_action") break;
    } else if (event.type === "session.status_terminated") {
      break;
    }
  }

  console.log("\n\nDone.");

  // Cleanup
  await client.beta.sessions.delete(session.id);
}

main().catch(console.error);
