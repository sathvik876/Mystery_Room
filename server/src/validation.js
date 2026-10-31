import { z } from "zod";

const difficultyCounts = {
  Easy: { suspects: 3, clues: 5, hints: 2 },
  Medium: { suspects: 4, clues: 7, hints: 3 },
  Hard: { suspects: 5, clues: 9, hints: 3 },
};

const suspectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(80),
  description: z.string().min(8).max(400),
  alibi: z.string().min(8).max(400),
});

const clueSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(100),
  description: z.string().min(8).max(500),
});

const mysterySchema = z.object({
  title: z.string().min(4).max(120),
  story: z.string().min(50).max(2500),
  suspects: z.array(suspectSchema),
  clues: z.array(clueSchema),
  hints: z.array(z.string().min(8).max(400)),
  solution: z.object({
    culpritId: z.string().min(1),
    explanation: z.string().min(30).max(1500),
  }),
});

export function validatePremise(body) {
  return z.object({
    premise: z.string().trim().min(10).max(500),
    difficulty: z.enum(["Easy", "Medium", "Hard"]),
  }).safeParse(body);
}

export function validateGeneratedMystery(value, difficulty) {
  const parsed = mysterySchema.safeParse(value);
  if (!parsed.success) {
    throw new Error(`Generated mystery did not match the required format: ${parsed.error.issues[0]?.message}`);
  }

  const expected = difficultyCounts[difficulty];
  const mystery = parsed.data;
  const suspectIds = new Set(mystery.suspects.map((suspect) => suspect.id));
  const clueIds = mystery.clues.map((clue) => clue.id);
  const suspectNames = mystery.suspects.map((suspect) => suspect.name.toLowerCase());

  if (
    mystery.suspects.length !== expected.suspects ||
    mystery.clues.length !== expected.clues ||
    mystery.hints.length !== expected.hints
  ) {
    throw new Error(`Generated ${difficulty} mystery has incorrect suspect, clue, or hint counts.`);
  }
  if (suspectIds.size !== mystery.suspects.length || new Set(clueIds).size !== clueIds.length) {
    throw new Error("Generated mystery contains duplicate IDs.");
  }
  if (new Set(suspectNames).size !== suspectNames.length || !suspectIds.has(mystery.solution.culpritId)) {
    throw new Error("Generated mystery has duplicate suspect names or an unknown culprit.");
  }

  return mystery;
}

export const difficultyPoints = { Easy: 100, Medium: 150, Hard: 200 };
