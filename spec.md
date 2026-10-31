1. Project Overview
AI Mystery Room is an AI-powered web application where users create and solve mysteries generated using Gemini. Players investigate suspects, discover clues, request hints, and identify the culprit.
The objective is to plan the project using a detailed spec sheet, build the application, deploy it, and demonstrate a complete mystery-solving experience on the live website.
2. Phase 1: Create a Detailed Spec Sheet
Before writing any code, create a SPEC.md file. This document serves as the blueprint for the entire project and guides AI coding tools such as Codex through implementation.
A. Project Requirements
Project overview and problem statement.
Target users and expected user experience.
Core features and optional enhancements.
Technology stack: React, Vite, Tailwind CSS, Node.js, Express, MongoDB, Mongoose, and Gemini API.
Project limitations and final deliverables.
B. User Flow
Document the complete journey:
User opens the website.
User enters a mystery premise and selects a difficulty level.
Gemini generates the mystery, suspects, clues, and hints.
User investigates and discovers clues.
User requests hints if needed.
User accuses a suspect.
The application reveals the verdict, culprit, explanation, and score.
User can start another mystery.
C. UI and Page Specifications
Define the purpose and essential elements of each page:
Home: Project introduction and start button.
Create Mystery: Premise input and difficulty selector.
Investigation Room: Story, suspect cards, clues, hints, and progress.
Accusation: Suspect selection and submission.
Results: Verdict, score, culprit, and explanation.
Specify loading states, error messages, navigation, and responsive behavior. Students may use Stitch AI to generate an initial UI design, then document how each screen maps to the project requirements.
D. Backend and Database Design
Document the API endpoints, request and response formats, validation rules, and error handling.
Suggested endpoints:
POST /api/cases — Generate a mystery.
GET /api/cases/:id — Retrieve an active mystery.
POST /api/cases/:id/clues/:clueId/discover — Discover a clue.
POST /api/cases/:id/hints — Request a hint.
POST /api/cases/:id/accuse — Submit an accusation.
GET /api/cases/:id/result — Retrieve the completed result.
Define a database model containing the mystery title, story, difficulty, suspects, clues, hints, player progress, accusation, and score.
Security requirement: Keep the culprit and solution on the backend until the player submits an accusation.
E. AI Behavior and Scoring Rules
Specify the expected Gemini output format and validate generated responses before saving them.
Difficulty
Suspects
Clues
Hints
Easy
3
5
2
Medium
4
7
3
Hard
5
9
3

Define scoring rules in the spec sheet:
Correct accusation: Easy 100, Medium 150, Hard 200 points.
Each discovered clue: +5 points.
Each hint used: −10 points.
Minimum score: 0.
Require a logically consistent solution supported by the clues. Scoring and validation must happen on the backend.
F. Acceptance Criteria
Define clear conditions that determine whether the project is complete:
Users can generate mysteries at all three difficulty levels.
Players can investigate, request hints, and submit accusations.
The solution is not revealed prematurely.
Scores are calculated and validated by the backend.
Results display the correct culprit and explanation.
The application works on the deployed website.
Spec sheet deliverable: A complete SPEC.md that another developer or AI coding assistant can follow without major clarification.
3. Phase 2: Set Up the Project
Create separate frontend and backend applications.
Frontend setup:
npm create vite@latest client -- --template react
cd client
npm install
npm install react-router-dom axios
Backend setup:
mkdir server
cd server
npm init -y
npm install express cors dotenv mongoose @google/genai zod
npm install --save-dev nodemon
Create a backend .env file:
PORT=5000
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
CLIENT_URL=http://localhost:5173
Never expose API keys in frontend code or commit secrets to GitHub.
4. Phase 3: Build the Application
Follow the SPEC.md step by step:
Set up Express and connect MongoDB.
Create the database model and API endpoints.
Integrate Gemini to generate structured mystery data.
Validate AI output and keep the solution private.
Build the React pages and connect them to the APIs.
Implement clue discovery, hints, accusations, and scoring.
Display the final result and allow users to start another mystery.
Test every feature against the acceptance criteria.
Students can use Codex or another AI coding assistant, but they should provide it with the spec sheet first. Build and test the application incrementally instead of generating everything in one step.
5. Phase 4: Test and Deploy
Verify that:
All difficulty levels work.
Invalid AI responses are handled safely.
Clues, hints, accusations, and scoring work correctly.
The solution is not exposed before the accusation.
The application handles API failures gracefully.
The complete game works after deployment.
Deploy the backend to a suitable hosting provider, configure MongoDB Atlas, and deploy the frontend to Vercel. Configure environment variables and test the complete workflow using the production website.
6. Final Submission
Complete the following steps:
Create and finalize SPEC.md.
Build the application according to the spec sheet.
Test the complete mystery-solving flow.
Deploy the application.
Create and solve a mystery on the deployed website.
Submit:
GitHub Repository: Complete source code.
Live Website URL: Deployed application.
Final goal: Students should demonstrate that they can plan a project using a clear spec sheet, build an AI-powered application systematically, validate its behavior, and deploy a working experience.

---

# AI Mystery Room — Implementation Specification

## Product definition

AI Mystery Room (branded **Obscura — The Mystery Room**) is a responsive, single-player detective game. A player supplies a fictional premise, chooses a difficulty, investigates a closed case by uncovering clues and optionally requesting hints, and submits one accusation. The backend owns all authoritative game state, the culprit, scoring, and the final explanation.

### Audience and experience

The application is intended for casual mystery fans and students demonstrating a complete AI application. It should feel atmospheric and readable rather than intimidating. The main journey should work on mobile and desktop, explain the cost of hints, provide useful loading and error feedback, and never require an account.

### Scope

Required: case generation, three difficulty levels, suspect and clue investigation, bounded hints, one accusation, backend-calculated scoring, final verdict, and a new-case path. Gemini generation and MongoDB persistence are supported when configured. For local setup without credentials, deterministic generation and in-memory storage keep the complete game playable.

Out of scope: accounts, multiplayer, public sharing, payments, player profiles, and permanent storage when MongoDB is not configured.

## Difficulty and scoring

| Difficulty | Suspects | Clues | Hints | Correct accusation base |
|---|---:|---:|---:|---:|
| Easy | 3 | 5 | 2 | 100 |
| Medium | 4 | 7 | 3 | 150 |
| Hard | 5 | 9 | 3 | 200 |

Final score is `max(0, (correct ? basePoints : 0) + clueCount * 5 - hintsUsed * 10)` where the correct base is added only for a correct accusation. Clue points are awarded for distinct clues discovered; a clue can only be discovered once. A wrong accusation receives no base points. All calculations are performed by the API, never trusted from the browser.

## User journey and screens

1. **Home (`/`)** — Introduces the experience and links to a new case.
2. **Create (`/create`)** — Accepts a premise of 10–500 characters and Easy, Medium, or Hard difficulty. Shows each level's case size and explains that hints reduce the score. While generating, the submit action is disabled and a progress indicator is shown. Validation and server errors are displayed inline.
3. **Investigation (`/case/:id`)** — Shows the case title, difficulty, story, all suspects with descriptions and alibis, and clue titles. Each undiscovered clue is examined explicitly; its description is shown only after the backend records discovery. The progress count tracks distinct discoveries. Hints are requested one at a time and revealed in the room. A player may proceed to accusation at any time.
4. **Accusation (`/case/:id/accuse`)** — Requires selecting one suspect and confirms that submission closes the case. A successful submission routes to the result.
5. **Result (`/case/:id/result`)** — Available only after accusation. Shows whether the accusation was correct, the accused person, culprit, explanation, score, and the score breakdown. The player can start a fresh case.

All pages include navigation, keyboard-visible focus, responsive layouts, and explicit loading, unavailable-case, and request-error states.

## Mystery generation contract

The generator returns a JSON object with:

```json
{
  "title": "string",
  "story": "string",
  "suspects": [{ "id": "unique string", "name": "string", "description": "string", "alibi": "string" }],
  "clues": [{ "id": "unique string", "title": "string", "description": "string" }],
  "hints": ["string"],
  "solution": { "culpritId": "suspect ID", "explanation": "string" }
}
```

The server validates field lengths and types, difficulty-specific counts, unique suspect/clue IDs, unique suspect names, and that the culprit references an existing suspect before saving. Prompts must request a fair-play solution supported by multiple clues. Invalid AI output fails with an API error; it is not saved or silently replaced by a fabricated AI result. The built-in generator is used only when no Gemini API key is configured.

The solution is stored only on the server. Case creation and retrieval responses omit `solution`, `culpritId`, and explanations. Undiscovered clue descriptions are also omitted. The accusation response is the first response allowed to reveal the verdict and solution.

## API contract

All routes are prefixed with `/api`; JSON errors use `{ "error": "human-readable message" }`.

| Method and path | Request | Success |
|---|---|---|
| `GET /health` | — | `{ status: "ok", storage: "memory" \| "mongodb" }` |
| `POST /cases` | `{ "premise": "10–500 chars", "difficulty": "Easy" \| "Medium" \| "Hard" }` | `201`; public case with id, story, suspects, clue titles/discovery flags and progress |
| `GET /cases/:id` | — | `200`; same public case; description only for discovered clues |
| `POST /cases/:id/clues/:clueId/discover` | — | `200`; `{ clue: { id, title, description } }`; repeated discovery is idempotent |
| `POST /cases/:id/hints` | — | `200`; `{ hint, hintsUsed, hintsRemaining }`; returns `409` when exhausted |
| `POST /cases/:id/accuse` | `{ "suspectId": "case suspect ID" }` | `200`; `{ correct, accusedName, culpritId, culpritName, explanation, score, difficulty, cluesFound, hintsUsed }` |
| `GET /cases/:id/result` | — | `200` after accusation; otherwise `409` |

Invalid premise/difficulty or suspect selection returns `400`; unknown cases or clues return `404`; closed cases, duplicate accusations, and exhausted hints return `409`; unexpected generation/storage failures return `500` with a safe message and are logged by the server. The browser does not supply or control score values.

## Data model

Each case stores a title, premise, story, difficulty, suspects, clues, hints, private solution, and progress (`discoveredClueIds`, `hintsUsed`, `accusation`, and `result`) with timestamps. MongoDB uses the Mongoose `Case` model. Without `MONGODB_URI`, the API uses a process-local map; cases in that mode are lost when the server restarts.

## Technology and configuration

- Client: React, Vite, React Router, Axios, responsive CSS.
- Server: Node.js, Express, Mongoose, Zod, `@google/genai`.
- Optional server variables in `server/.env`: `PORT` (default 5000), `CLIENT_URL` (default `http://localhost:5173`), `GEMINI_API_KEY`, `GEMINI_MODEL` (default `gemini-2.5-flash`), and `MONGODB_URI`.
- Client API origin can be set with `client/.env` as `VITE_API_URL`; default is `http://localhost:5000/api`.
- Secrets belong only in the server environment and must not be committed or exposed to Vite.

## Acceptance checks

- Each difficulty produces exactly its specified number of suspects, clues, and hints.
- A player can complete a case with no API keys using local fallback services.
- With valid Gemini/MongoDB configuration, generation uses Gemini and cases persist in MongoDB.
- Invalid generator data is rejected before saving.
- Before accusation, no response exposes culprit identity, solution explanation, or undiscovered clue contents.
- Clue discovery is idempotent; hint limits and completed-case restrictions are enforced.
- Backend score matches the formula for correct and incorrect accusations, clue count, and hints, including the zero floor.
- A result cannot be fetched before an accusation; the final page presents the authoritative backend result.
- Client production build succeeds and the development client/server run locally on ports 5173/5000.

Deployment requires configuring the server's environment variables and a MongoDB Atlas database, deploying the API and frontend separately, setting `CLIENT_URL` and `VITE_API_URL` to their production origins, and testing the complete game against the deployed services.
