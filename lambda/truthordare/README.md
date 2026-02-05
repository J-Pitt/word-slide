# Truth or Dare Room API

Game-code flow for "Play with others": create room, share code, join, sync state.

**If you use a different service** (e.g. from another repo): set `VITE_TRUTHORDARE_ROOM_API_BASE` in `.env` to that service’s base URL. The frontend expects the same API shape (create → `{ roomId, gameCode, players }`, join → `{ roomId, players, state }`, GET room → `{ players, state, updatedAt }`, POST with `{ roomId, state }` to update). If your service uses a different shape, we need an adapter—share the other repo’s room code or add that repo to the workspace.

## Database

Run the table script in your `wordslide_game` database:

```bash
# From repo root, or run the SQL in your DB client
psql $DATABASE_URL -f docs/aws-infrastructure/truthordare-rooms-table.sql
```

## API Routes

- **POST** `/truthordare/room`  
  - Body `{}` or `{ hostName }` → create room; returns `{ roomId, gameCode, players }`.
  - Body `{ roomId, state }` → update room state (host sync).
- **POST** `/truthordare/room/join`  
  Body `{ gameCode, playerName }` → join room; returns `{ roomId, players, state }`.
- **GET** `/truthordare/room?roomId=...`  
  Returns `{ roomId, gameCode, players, state, updatedAt }`.

## Deploy

1. Create the `truthordare_rooms` table (see above).
2. In API Gateway, add resources and methods for `/truthordare/room` (GET, POST) and `/truthordare/room/join` (POST), all integrated with this Lambda.
3. Deploy the Lambda with the same DB env vars as your other game Lambdas (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`).
4. Ensure CORS allows your frontend origin.

Frontend uses the same base URL as the rest of the app (`/api` in dev via proxy, or your API Gateway URL in production).
