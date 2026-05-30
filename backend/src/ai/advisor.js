/**
 * In-game Socratic advisor — RAG + LLM, server-side context only.
 */

const Groq = require("groq-sdk");
const { retrieve, formatChunksForPrompt } = require("../rag/retriever");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function formatMistakes(mistakes) {
  if (!mistakes?.length) return "None yet in this game.";
  return mistakes
    .map(
      (m) =>
        `R${m.round} "${m.title}": chose ${m.choiceMade} (optimal ${m.optimalChoice})${m.patternLabel ? ` — ${m.patternLabel}` : ""}`,
    )
    .join("\n");
}

function formatUserProfile(profile) {
  if (!profile) return "No onboarding profile on file.";
  const lines = [];
  const { onboarding, pastGames } = profile;

  if (onboarding) {
    lines.push(
      `Archetype: ${onboarding.archetype}`,
      `Confidence: ${onboarding.confidenceLevel}/5`,
      `Primary goal: ${onboarding.primaryGoal}`,
    );
  }

  if (pastGames?.gamesCompleted > 0) {
    lines.push(`Past games completed: ${pastGames.gamesCompleted}`);
    if (pastGames.dominantPatternLabel) {
      lines.push(`Recurring mistake pattern: ${pastGames.dominantPatternLabel}`);
    }
    if (pastGames.averageScore != null) {
      lines.push(`Average debrief score: ${pastGames.averageScore}/1000`);
    }
  } else {
    lines.push("First completed game pending — no cross-game history.");
  }

  return lines.join("\n");
}

function buildSystemPrompt(chunks, context) {
  const { round, metrics, choiceContext, currentMistakes, userProfile } = context;

  return `You are FinSim Advisor — a Socratic financial educator inside a 10-round life simulation.

RULES:
- Ask exactly ONE thoughtful question. No answer reveals. Never say "you should" or name the correct option.
- Ground the question in the player's real numbers and current decision.
- If they made suboptimal choices earlier, reference the pattern — not the "right" pick.
- Use retrieved knowledge for precision, not lectures.
- Tone: calm, sharp, non-judgmental. Future-facing only.
- Length: 2-3 sentences max (~200-250 tokens).

[RETRIEVED KNOWLEDGE]
${formatChunksForPrompt(chunks)}

[CURRENT STATE — Round ${round}]
Career: ${metrics.careerLabel || "N/A"} | Goal: ${metrics.goal || "N/A"}
Net worth: $${metrics.netWorth?.toLocaleString() ?? "N/A"}
Credit: ${metrics.creditScore ?? "N/A"} | Debt: $${metrics.totalDebt?.toLocaleString() ?? "0"}
Emergency fund: ${metrics.emergencyFundMonths ?? 0} mo | Surplus: $${metrics.monthlySurplus?.toLocaleString() ?? "N/A"}/mo
Stress: ${metrics.stressIndex ?? 0}/100 | 401k active: ${metrics.is401kActive ? "yes" : "no"}

[DECISION ON TABLE]
${choiceContext.title}
A: ${choiceContext.optionA}
B: ${choiceContext.optionB}

[SUBOPTIMAL CHOICES THIS GAME]
${formatMistakes(currentMistakes)}

[PLAYER PROFILE]
${formatUserProfile(userProfile)}`;
}

/**
 * Generate a single advisor insight from server-built context.
 * @returns {Promise<{ message: string, sources: object[] }>}
 */
async function generateAdvisorResponse(context) {
  const chunks = await retrieve(context.query, {
    topK: 5,
    rounds: [context.round],
    career: context.career,
  });

  const systemPrompt = buildSystemPrompt(chunks, context);

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 250,
    temperature: 0.4,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content:
          "Generate one Socratic question for the player about their current decision.",
      },
    ],
  });

  const message = completion.choices[0]?.message?.content?.trim();
  if (!message) {
    throw new Error("Advisor returned an empty response");
  }

  return {
    message,
    sources: chunks.map((c) => ({
      id: c.id,
      source: c.source,
      topic: c.topic,
      similarity: c.similarity,
    })),
  };
}

module.exports = { generateAdvisorResponse };
