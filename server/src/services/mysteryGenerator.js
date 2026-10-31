import { GoogleGenAI } from "@google/genai";
import { validateGeneratedMystery } from "../validation.js";

const counts = {
  Easy: { suspects: 3, clues: 5, hints: 2 },
  Medium: { suspects: 4, clues: 7, hints: 3 },
  Hard: { suspects: 5, clues: 9, hints: 3 },
};

function makeFallback(premise, difficulty) {
  const count = counts[difficulty];
  const cleanPremise = premise.trim().replace(/[.!?]+$/, "");
  const names = ["Mara Voss", "Elliot Finch", "June Bell", "Theo Vale", "Nadia Cross"];
  const locations = ["the conservatory", "the west gallery", "the old study", "the glasshouse", "the clock tower"];
  const culpritId = "suspect-1";
  const suspects = names.slice(0, count.suspects).map((name, index) => ({
    id: `suspect-${index + 1}`,
    name,
    description: [
      "The curator who knows every hidden passage in the building.",
      "A quiet archivist with a talent for restoring damaged documents.",
      "The event planner who had access to every room that evening.",
      "A night attendant who insists the security system never failed.",
      "A visiting collector whose history with the family is unclear.",
    ][index],
    alibi: [
      "Claims to have been alone in the conservatory when the lights went out.",
      "Says they were cataloguing books in the west gallery.",
      "Remembers speaking with two guests near the entrance.",
      "Reports checking the generator in the lower hall.",
      "Was seen leaving the dining room shortly before the alarm.",
    ][index],
  }));
  const clues = Array.from({ length: count.clues }, (_, index) => ({
    id: `clue-${index + 1}`,
    title: [
      "A broken seal", "The impossible timestamp", "A trace of blue wax",
      "The switched ledger", "A witness changes their story",
      "Dust on the windowsill", "A missing key", "A note in the margin", "The final contradiction",
    ][index],
    description: [
      "A wax seal was broken from the inside, despite the room being locked. The seal bears a tiny imprint used only by the curator.",
      "The hall clock stopped seven minutes before the blackout, placing the curator's alibi in doubt.",
      "Blue sealing wax matches the rare sticks kept in the curator's desk, not the common red wax in the study.",
      "An inventory entry was rewritten in fresh ink. The original, faintly visible beneath it, records the curator borrowing the key.",
      "A guest recalls seeing the curator near the locked room, despite the curator claiming to be elsewhere.",
      "The outside sill is untouched by dust; no one entered through the window as the curator suggested.",
      "The spare key is back in its cabinet, but its impression is missing from the night's security log.",
      "A note says the valuable object was moved before the lights failed, contradicting the curator's timeline.",
      "The curator knew a detail about the scene that had not yet been shared with anyone.",
    ][index],
  }));

  return {
    title: `The ${(cleanPremise.match(/[A-Za-z]{4,}/)?.[0] ?? "Midnight").replace(/^./, (letter) => letter.toUpperCase())} Affair`,
    story: `A strange incident has unsettled the house: ${cleanPremise}.\n\nAt the center of the mystery is a locked room in ${locations[0]}. The evidence does not point in one direction at first, and every suspect has a reason to be questioned. Study their accounts, find the clues hidden around the room, and compare the timeline before deciding who is responsible.`,
    suspects,
    clues,
    hints: [
      "Look for the suspect whose alibi depends on a detail that the physical evidence disproves.",
      "The person who knew the room's security weakness had an opportunity no one else could explain.",
      ...(count.hints === 3 ? ["Compare the timing of the rewritten record with the blackout."] : []),
    ],
    solution: {
      culpritId,
      explanation: `${suspects[0].name} is the culprit. The broken seal, the altered ledger, and the witness account independently place them at the locked room. Their explanation depends on entering through the window, but the undisturbed dust rules that out. Together, the evidence shows they had access, opportunity, and knowledge of the security weakness.`,
    },
  };
}

export async function generateMystery(premise, difficulty) {
  if (!process.env.GEMINI_API_KEY) {
    return validateGeneratedMystery(makeFallback(premise, difficulty), difficulty);
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const expected = counts[difficulty];
  const prompt = `Create a fair-play detective mystery based on this premise: "${premise}". Difficulty: ${difficulty}.
Return ONLY JSON with fields: title, story, suspects, clues, hints, solution.
Exactly ${expected.suspects} suspects, ${expected.clues} clues, and ${expected.hints} hints.
Each suspect: id, name, description, alibi. Each clue: id, title, description. solution: culpritId, explanation.
Make one culprit and ensure at least three clues logically support the solution while other suspects have plausible but falsifiable motives or alibis. Keep solution details out of the story and clues; don't identify the culprit until the solution field. IDs must be unique.`;
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });

  if (!response.text) {
    throw new Error("Gemini returned an empty mystery.");
  }
  let generated;
  try {
    generated = JSON.parse(response.text);
  } catch (error) {
    throw new Error(`Gemini returned invalid JSON: ${error.message}`);
  }
  return validateGeneratedMystery(generated, difficulty);
}
