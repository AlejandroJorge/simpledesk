# Organization Tool

Simple organization tool for managing tasks and notes.

## Requirements
- Node.js 22+
- npm 10+
- SQLite accessible through a file path

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and adjust values as needed.
3. Run the local dev server:
   ```bash
   npm run dev
   ```

## Environment Variables
| Name | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Absolute or relative path to the SQLite database file (e.g. `./local.db`). |
| `SESSION_SECRET` | Yes | Long random string used to sign session cookies. Generate at least 32 bytes of entropy (e.g. `openssl rand -hex 32`). |
| `WORKSPACE_TIMEZONE` | No (default `UTC`) | IANA timezone used for due date calculations and overdue checks (e.g. `America/New_York`). |


## Useful Scripts
- `npm run dev` – start the dev server with hot reload.
- `npm run build` – generate the production build.
- `npm run preview` – preview the production build locally.
- `npm run check` – type-check and lint the project.
- `npm run db:push` / `npm run db:migrate` – apply the Drizzle schema to the configured SQLite database.

## Docker
A multi-stage Dockerfile is included for production builds:
```bash
# Build the image
docker build -t organization-tool .

# Run the container (mounting the SQLite file for persistence)
docker run \
  -p 3000:3000 \
  -e DATABASE_URL=/data/local.db \
  -e SESSION_SECRET=$(openssl rand -hex 32) \
  -v $(pwd)/local.db:/data/local.db \
  organization-tool
```
By default the container listens on `PORT` (defaults to 3000). Adjust `DATABASE_URL` to point at the mounted SQLite file path inside the container, set `SESSION_SECRET` to a long random string (you can also use `--env-file` or an orchestrator secret), and optionally override `WORKSPACE_TIMEZONE`.
