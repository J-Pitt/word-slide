# Question · Truth · Dare Game

The game is available at **`/game`** (and `/truthordare`) on this site (e.g. `https://word-slide.com/game`).

## What’s in this repo

- **Routes:** `/game` and `/truthordare` both render the same game (Truth or Dare board, dice, prompts).
- **Components:** `src/pages/truthordare/Game.jsx`, `Dice.jsx`, `GameBoard.jsx`, etc.
- **Styles:** `src/pages/truthordare/game.css` (scoped under `.qtd-game`).
- **Data:** Prompts come from `src/pages/truthordare/data/` (e.g. `listB.js`, `board.js`).

## Password protection

The `/game` (and `/truthordare`) page can be protected by a password in two ways.

### 1. Server-side (recommended for production)

- Set the **`GAME_PASSWORD`** environment variable for the **game-auth Lambda** (e.g. in AWS Lambda console → Configuration → Environment variables, or via CloudFormation parameter `GamePassword`).
- If `GAME_PASSWORD` is not set, the game-auth API returns `{ configured: false }` and the app shows *“Game isn’t configured”* (unless client-side password is set).
- After a correct password, access is remembered for **24 hours** via an HTTP-only cookie set by the API.
- The password is only stored in the Lambda (or CloudFormation) env; it is never in the client bundle.

**Endpoints:**

- `GET /game-auth/status` — returns `{ "configured": true }` when `GAME_PASSWORD` is set.
- `POST /game-auth/login` — body `{ "password": "..." }`; if correct, sets cookie and returns `{ "ok": true }`.
- `GET /game-auth/check` — returns `{ "ok": true }` if the request has a valid cookie.

**CloudFormation:** The template `aws-infrastructure/cloudformation.yaml` includes a `GamePassword` parameter and the game-auth Lambda + API Gateway resources. Pass `GamePassword=yourpassword` when deploying (or set it later in the Lambda environment and redeploy the Lambda code from `lambda/game-auth/`).

### 2. Client-side (fallback)

- Set **`VITE_TRUTH_OR_DARE_PASSWORD`** in your `.env` (or build env). If the game-auth API is not configured or fails, the app uses this and remembers access in `sessionStorage` for the session.
- The password is in the client bundle; use only for dev or low-security use.

## Multiplayer (play from different locations)

When the **room API** is deployed and reachable, the game shows **“Play with others (different locations)”** in addition to **“Play locally”**.

- **Create game:** Play with others → Create → enter your name. You get a **room code** and a **Copy link** (`/game?room=CODE`). Share the code or link.
- **Join game:** Join → enter the code and your name. Opening a link with `?room=CODE` prefills the code.
- **Lobby:** Everyone sees the code, link, and player list. The creator can **Start game** when there are 2+ players.
- **Playing:** Turns are synchronized. Only the current player can roll; others see “It’s {name}’s turn”. **New round** clears the result and advances. **Leave game** returns to the landing screen.

Room data is stored in the existing database (PostgreSQL table `truthordare_rooms`). The room API is the Lambda at `lambda/truthordare/room.js`; ensure it is deployed and that the API base is set (e.g. `VITE_API_BASE` or `VITE_TRUTHORDARE_ROOM_API_BASE`).

## Deploy

- The `/game` page is built and deployed with the rest of the app (Vite build → static hosting).
- To enable server-side password: set `GAME_PASSWORD` (or CloudFormation `GamePassword`) for the game-auth Lambda and ensure the game-auth API routes are deployed (included in `cloudformation.yaml`).
- Optional: deploy the standalone game-auth Lambda code from `lambda/game-auth/` (e.g. zip `index.js` and update the `GameAuthFunction` Lambda) if you prefer the full implementation over the inline CloudFormation placeholder.

## Subdomain option

To run the game on its own subdomain (e.g. `game.yourdomain.com`) as a separate app, use a second Amplify (or static) app that builds this repo and deploys only the game routes and assets, with the same API base pointing to your main API.
