/**
 * chunk-knowledge.js
 * Run: node src/rag/chunk-knowledge.js
 */

const fs = require("fs");
const path = require("path");

const KNOWLEDGE_DIR = path.join(__dirname, "knowledge");
const OUTPUT_PATH = path.join(__dirname, "chunks.json"); // outputs to src/rag/chunks.json

function parseTextFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  const lines = raw.split("\n");

  const fileMeta = {};
  let i = 0;
  while (i < lines.length && !lines[i].startsWith("---CHUNK---")) {
    const line = lines[i].trim();
    if (line.startsWith("TOPIC:"))
      fileMeta.topic = line.replace("TOPIC:", "").trim();
    if (line.startsWith("SOURCE:"))
      fileMeta.source = line.replace("SOURCE:", "").trim();
    if (line.startsWith("LAST_UPDATED:"))
      fileMeta.last_updated = line.replace("LAST_UPDATED:", "").trim();
    if (line.startsWith("APPLIES_TO_ROUNDS:")) {
      const val = line.replace("APPLIES_TO_ROUNDS:", "").trim();
      fileMeta.applies_to_rounds = val
        ? val
            .split(",")
            .map((n) => parseInt(n.trim(), 10))
            .filter(Boolean)
        : null;
    }
    if (line.startsWith("CAREER_RELEVANCE:")) {
      const val = line.replace("CAREER_RELEVANCE:", "").trim();
      fileMeta.career_relevance = val
        ? val.split(",").map((s) => s.trim())
        : ["all"];
    }
    i++;
  }

  const chunks = [];
  while (i < lines.length) {
    if (lines[i].startsWith("---CHUNK---")) {
      i++;
      const chunkMeta = {};
      while (i < lines.length && lines[i].trim() !== "") {
        const line = lines[i].trim();
        if (line.startsWith("SUBTOPIC:"))
          chunkMeta.subtopic = line.replace("SUBTOPIC:", "").trim();
        if (line.startsWith("DIFFICULTY:"))
          chunkMeta.difficulty = line.replace("DIFFICULTY:", "").trim();
        i++;
      }
      while (i < lines.length && lines[i].trim() === "") i++;

      const bodyLines = [];
      while (i < lines.length && !lines[i].startsWith("---CHUNK---")) {
        bodyLines.push(lines[i]);
        i++;
      }

      const content = bodyLines.join("\n").trim();
      if (content) {
        chunks.push({
          content,
          source: fileMeta.source || "unknown",
          topic: fileMeta.topic || "general",
          subtopic: chunkMeta.subtopic || null,
          difficulty: chunkMeta.difficulty || "foundational",
          applies_to_rounds: fileMeta.applies_to_rounds || null,
          career_relevance: fileMeta.career_relevance || ["all"],
          last_updated: fileMeta.last_updated || null,
        });
      }
    } else {
      i++;
    }
  }
  return chunks;
}

function parseJsonFile(filePath) {
  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return raw.map((round) => {
    const content = [
      `Round ${round.round}: ${round.title}`,
      `Topic: ${round.topic}`,
      `Optimal choice: ${round.optimal_label}`,
      `Suboptimal choice: ${round.suboptimal_label}`,
      `Reasoning: ${round.reasoning}`,
      `Common mistake: ${round.common_mistake}`,
      `Teaching moment: ${round.teaching_moment}`,
      `Behavioral pattern: ${round.behavioral_pattern}`,
    ].join("\n");

    return {
      content,
      source: "finsim-internal",
      topic: round.topic,
      subtopic: `round_${round.round}_decision`,
      difficulty: "intermediate",
      applies_to_rounds: round.applies_to_rounds,
      career_relevance: round.career_relevance || ["all"],
      last_updated: "2024-01",
    };
  });
}

function main() {
  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    console.error(`❌ Knowledge directory not found: ${KNOWLEDGE_DIR}`);
    process.exit(1);
  }

  const allChunks = [];
  const files = fs.readdirSync(KNOWLEDGE_DIR);

  for (const file of files) {
    const filePath = path.join(KNOWLEDGE_DIR, file);
    const ext = path.extname(file);

    if (ext === ".txt") {
      console.log(`📄 Parsing: ${file}`);
      const chunks = parseTextFile(filePath);
      console.log(`   → ${chunks.length} chunks`);
      allChunks.push(...chunks);
    } else if (ext === ".json") {
      console.log(`📋 Parsing: ${file}`);
      const chunks = parseJsonFile(filePath);
      console.log(`   → ${chunks.length} chunks`);
      allChunks.push(...chunks);
    }
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allChunks, null, 2));

  console.log(`\n✅ Chunking complete`);
  console.log(`   Total chunks: ${allChunks.length}`);
  console.log(`   Output: ${OUTPUT_PATH}`);

  const topicCounts = allChunks.reduce((acc, c) => {
    acc[c.topic] = (acc[c.topic] || 0) + 1;
    return acc;
  }, {});
  console.log("\n📊 Chunks by topic:");
  Object.entries(topicCounts)
    .sort(([, a], [, b]) => b - a)
    .forEach(([topic, count]) =>
      console.log(`   ${topic.padEnd(25)} ${count}`),
    );
}

main();
