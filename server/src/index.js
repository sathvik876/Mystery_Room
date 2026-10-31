import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { generateMystery } from "./services/mysteryGenerator.js";
import { findCase, persistCase, saveCase } from "./services/caseStore.js";
import { difficultyPoints, validatePremise } from "./validation.js";

const app = express();
const port = Number(process.env.PORT) || 5000;
const allowedOrigin = process.env.CLIENT_URL || "http://localhost:5173";

app.use(cors({ origin: allowedOrigin }));
app.use(express.json({ limit: "20kb" }));

function publicCase(record) {
  const discovered = new Set(record.progress.discoveredClueIds);
  return {
    id: String(record._id),
    title: record.title,
    story: record.story,
    difficulty: record.difficulty,
    suspects: record.suspects,
    clues: record.clues.map(({ id, title, description }) => ({
      id,
      title,
      discovered: discovered.has(id),
      ...(discovered.has(id) ? { description } : {}),
    })),
    progress: {
      discoveredClueIds: record.progress.discoveredClueIds,
      hintsUsed: record.progress.hintsUsed,
      hintsRemaining: record.hints.length - record.progress.hintsUsed,
      completed: Boolean(record.progress.result),
    },
  };
}

function getId(request) {
  return request.params.id;
}

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok", storage: mongoose.connection.readyState === 1 ? "mongodb" : "memory" });
});

app.post("/api/cases", async (request, response, next) => {
  const parsed = validatePremise(request.body);
  if (!parsed.success) {
    return response.status(400).json({ error: "Enter a premise between 10 and 500 characters and choose a valid difficulty." });
  }
  try {
    const { premise, difficulty } = parsed.data;
    const generated = await generateMystery(premise, difficulty);
    const record = await saveCase({
      premise,
      ...generated,
      difficulty,
      progress: { discoveredClueIds: [], hintsUsed: 0, accusation: null, result: null },
    });
    response.status(201).json(publicCase(record));
  } catch (error) {
    next(error);
  }
});

app.get("/api/cases/:id", async (request, response, next) => {
  try {
    const record = await findCase(getId(request));
    if (!record) return response.status(404).json({ error: "This case could not be found." });
    response.json(publicCase(record));
  } catch (error) {
    next(error);
  }
});

app.post("/api/cases/:id/clues/:clueId/discover", async (request, response, next) => {
  try {
    const record = await findCase(getId(request));
    if (!record) return response.status(404).json({ error: "This case could not be found." });
    if (record.progress.result) return response.status(409).json({ error: "This case is already closed." });
    const clue = record.clues.find((item) => item.id === request.params.clueId);
    if (!clue) return response.status(404).json({ error: "That clue does not belong to this case." });
    if (!record.progress.discoveredClueIds.includes(clue.id)) {
      record.progress.discoveredClueIds.push(clue.id);
      await persistCase(record);
    }
    response.json({ clue: { id: clue.id, title: clue.title, description: clue.description } });
  } catch (error) {
    next(error);
  }
});

app.post("/api/cases/:id/hints", async (request, response, next) => {
  try {
    const record = await findCase(getId(request));
    if (!record) return response.status(404).json({ error: "This case could not be found." });
    if (record.progress.result) return response.status(409).json({ error: "This case is already closed." });
    if (record.progress.hintsUsed >= record.hints.length) {
      return response.status(409).json({ error: "You have used all available hints." });
    }
    const hint = record.hints[record.progress.hintsUsed];
    record.progress.hintsUsed += 1;
    await persistCase(record);
    response.json({ hint, hintsUsed: record.progress.hintsUsed, hintsRemaining: record.hints.length - record.progress.hintsUsed });
  } catch (error) {
    next(error);
  }
});

app.post("/api/cases/:id/accuse", async (request, response, next) => {
  try {
    const record = await findCase(getId(request));
    if (!record) return response.status(404).json({ error: "This case could not be found." });
    if (record.progress.result) return response.status(409).json({ error: "An accusation has already been submitted." });
    const suspectId = request.body?.suspectId;
    if (typeof suspectId !== "string" || !record.suspects.some((suspect) => suspect.id === suspectId)) {
      return response.status(400).json({ error: "Choose a suspect from this case." });
    }
    record.progress.accusation = suspectId;
    const correct = suspectId === record.solution.culpritId;
    const baseScore = correct ? difficultyPoints[record.difficulty] : 0;
    const score = Math.max(0, baseScore + record.progress.discoveredClueIds.length * 5 - record.progress.hintsUsed * 10);
    const accused = record.suspects.find((suspect) => suspect.id === suspectId);
    const culprit = record.suspects.find((suspect) => suspect.id === record.solution.culpritId);
    record.progress.result = {
      correct,
      accusedName: accused.name,
      culpritId: record.solution.culpritId,
      culpritName: culprit.name,
      explanation: record.solution.explanation,
      score,
      difficulty: record.difficulty,
      cluesFound: record.progress.discoveredClueIds.length,
      hintsUsed: record.progress.hintsUsed,
    };
    await persistCase(record);
    response.json(record.progress.result);
  } catch (error) {
    next(error);
  }
});

app.get("/api/cases/:id/result", async (request, response, next) => {
  try {
    const record = await findCase(getId(request));
    if (!record) return response.status(404).json({ error: "This case could not be found." });
    if (!record.progress.result) return response.status(409).json({ error: "Submit an accusation before viewing the result." });
    response.json(record.progress.result);
  } catch (error) {
    next(error);
  }
});

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ error: "The case could not be completed. Please try again." });
});

if (process.env.MONGODB_URI) {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log("Connected to MongoDB.");
  } catch (error) {
    console.error("Could not connect to MongoDB; using in-memory case storage.", error.message);
  }
} else {
  console.log("MONGODB_URI not set; using in-memory case storage.");
}

app.listen(port, () => {
  console.log(`Mystery Room API listening on http://localhost:${port}`);
});
