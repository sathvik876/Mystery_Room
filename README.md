# AI Mystery Room

AI Mystery Room is a browser-based whodunit game. Create a premise, choose a difficulty, investigate a generated case, spend optional hints, and make an accusation to see the verdict and score.

## Run locally

Requirements: Node.js 20+ and npm.

```bash
npm install
npm install --prefix server
npm install --prefix client
```

Copy `server/.env.example` to `server/.env` and optionally configure Gemini and MongoDB. Both are optional for local play: without them, the app uses a built-in mystery generator and in-memory storage. If MongoDB is configured but unreachable, the API reports the connection error and starts with in-memory storage instead.

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The frontend proxies `/api` requests to the backend on port 5000.

To use AI generation, set `GEMINI_API_KEY`. To persist cases across server restarts, set `MONGODB_URI`. Never put either secret in the client environment.

## Upload to GitHub

Upload the project source and package lockfiles. Do not upload `server/.env`; it contains your private credentials and is excluded by `.gitignore`. The safe template `server/.env.example` is included. On GitHub, use **Add file → Upload files** and drag in the project files, or initialize Git in this folder and push the repository.

## Features

- Easy, Medium, and Hard cases have 3/5/2, 4/7/3, and 5/9/3 suspects/clues/hints respectively.
- Clue text is revealed only when the player discovers it. The culprit and solution stay on the backend until an accusation is submitted.
- Correct base points are 100/150/200 by difficulty; discovered clues add 5 points each, used hints subtract 10, and scores never fall below zero.
- Gemini output is schema-validated before a case can be saved. If Gemini is not configured, a complete local case is generated instead.

See [spec.md](./spec.md) for the detailed product and API specification.
