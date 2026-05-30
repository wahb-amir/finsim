/**
 * src/ai/advisor.js
 *
 * In-game Socratic advisor. Retrieves relevant chunks based on game state,
 * builds the prompt, streams a single Socratic question via Groq.
 */

const Groq = require("groq-sdk");
const { retrieve, formatChunksForPrompt } = require("../rag/retriever");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Query builder — server-side only, never from user input ──────────────────

function buildAdvisorQuery(round, metrics, choiceContext) {
  const parts = [`Round ${round}: ${choiceContext.title}`];

  if (metrics.creditCardDebt > 0)          parts.push("credit card debt compounding");
  if (metrics.emergencyFundMonths < 3)      parts.push("insufficient emergency fund");
  if (metrics.debtToIncome > 0.36)          parts.push("high debt-to-income ratio");
  if (metrics.stressIndex > 65)             parts.push("high financial stress indicators");
  if (!metrics.is401kActive)               parts.push("unclaimed employer 401k match");
  if (metrics.investmentBalance === 0)      parts.push("no investment portfolio established");
  if (metrics.creditScore && metrics.creditScore < 660) parts.push("low credit score impact");

  parts.push(`career: ${metrics.careerLabel || "general"}`);
  return parts.join(". ");
}

// ── System prompt ─────────────────────────────────────────────────────────────

function buildSystemPrompt(chunks, metrics, round, choiceContext) {
  return `You are FinSim Advisor — a financial educator who uses the Socratic method exclusively.

RULES (never break these):
1. Never state the correct answer. Never say "you should" or "the right choice is."
2. Ask exactly ONE question per response. Not two. Not a question with a follow-up.
3. The question must be grounded in the player's actual current financial state.
4. Use the retrieved context to make the question numerically precise where possible.
5. Do not explain concepts. Ask a question that makes the player reason through it.
6. If the player asks you a direct question, respond with a clarifying question instead.
7. Never be encouraging or discouraging about choices already made. Stay future-facing.
8. Tone: calm, intelligent, like a professor who has seen every financial mistake and holds none in contempt.
9. Maximum response length: 2 sentences. One is better.

[CONTEXT — retrieved financial knowledge]
${formatChunksForPrompt(chunks)}
[END CONTEXT]

[PLAYER STATE]
Round: ${round}
Career: ${metrics.careerLabel || "N/A"}
Net worth: $${metrics.netWorth?.toLocaleString() ?? "N/A"}
Credit score: ${metrics.creditScore ?? "N/A"}
Emergency fund: ${metrics.emergencyFundMonths ?? 0} months
Total debt: $${metrics.totalDebt?.toLocaleString() ?? "0"}
Monthly surplus: $${metrics.monthlySurplus?.toLocaleString() ?? "N/A"}
Stress index: ${metrics.stressIndex ?? 0}/100
Decision being considered: ${choiceContext.title}
Option A: ${choiceContext.optionA}
Option B: ${choiceContext.optionB}
[END PLAYER STATE]`;
}

// ── Main export — streams SSE tokens to Express response ─────────────────────

/**
 * @param {object} params
 * @param {number} params.round
 * @param {object} params.metrics       - current game metrics from MongoDB
 * @param {object} params.choiceContext - { title, optionA, optionB }
 * @param {object} res                  - Express response object (SSE)
 */
async function streamAdvisorResponse({ round, metrics, choiceContext }, res) {
  // 1. Build query from game state
  const query = buildAdvisorQuery(round, metrics, choiceContext);

  // 2. Retrieve relevant chunks with round + career pre-filtering
  const chunks = await retrieve(query, {
    topK:   5,
    rounds: [round],
    career: metrics.careerLabel || null,
  });

  // 3. Build prompt
  const systemPrompt = buildSystemPrompt(chunks, metrics, round, choiceContext);

  // 4. Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  // 5. Stream from Groq
  const stream = await groq.chat.completions.create({
    model:       "llama-3.3-70b-versatile",
    max_tokens:  120,
    temperature: 0.4,
    stream:      true,
    messages: [
      { role: "system",  content: systemPrompt },
      { role: "user",    content: "What should I consider for this decision?" },
    ],
  });

  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content || "";
    if (token) {
      res.write(`data: ${JSON.stringify({ token })}\n\n`);
    }
  }

  res.write("data: [DONE]\n\n");
  res.end();
}

module.exports = { streamAdvisorResponse };