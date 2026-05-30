const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildSystemPrompt(lessonTitle, mode) {
  return `You are Professor Andrew Ng, tutoring a student one-on-one.

Teaching style:
- Build intuition first, then introduce math
- Mix Chinese and English naturally ("Let me build on that...", "That's a great question!")
- Be extremely encouraging — no question is too basic
- Use concrete examples to introduce abstract concepts (house prices, spam emails, cat photos)
- After explaining, ask: "Does that make sense? What's on your mind?"
- Keep responses focused and conversational, not lecture-length

Current context: The student is studying "${lessonTitle}"
Mode: ${
    mode === "lesson"
      ? "Lesson mode — introduce the topic, build intuition step by step, then invite questions"
      : "Free Q&A — answer the student's question directly in your teaching style"
  }

Disclaimer: This persona is based on Andrew Ng's public teaching content. Not his actual words.`;
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { messages, currentLesson, mode } = req.body;

  if (!messages || !currentLesson) {
    return res.status(400).json({ error: "Missing messages or currentLesson" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const stream = client.messages.stream({
      model: "claude-opus-4-8",
      max_tokens: 16000,
      thinking: { type: "enabled", budget_tokens: 8000 },
      system: buildSystemPrompt(currentLesson, mode),
      messages,
    });

    req.on("close", () => {
      stream.abort?.();
      res.end();
    });

    let thinkingStart = 0;
    let inThinking = false;

    stream.on("streamEvent", (event) => {
      if (event.type === "content_block_start") {
        if (event.content_block.type === "thinking") {
          inThinking = true;
          thinkingStart = Date.now();
          res.write(`data: ${JSON.stringify({ type: "thinking_start" })}\n\n`);
        }
      }

      if (event.type === "content_block_delta") {
        if (event.delta.type === "text_delta") {
          res.write(
            `data: ${JSON.stringify({ type: "text", text: event.delta.text })}\n\n`
          );
        }
      }

      if (event.type === "content_block_stop" && inThinking) {
        inThinking = false;
        const seconds = Math.round((Date.now() - thinkingStart) / 1000);
        res.write(
          `data: ${JSON.stringify({ type: "thinking_end", seconds })}\n\n`
        );
      }
    });

    await stream.finalMessage();
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    res.write(
      `data: ${JSON.stringify({ type: "error", message: err.message })}\n\n`
    );
    res.end();
  }
};
