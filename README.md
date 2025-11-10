# Organization Tool

Simple organization tool for managing tasks and notes. Built with SvelteKit, Tailwind, and Drizzle ORM (SQLite).

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

> SQLite is the only supported database target at the moment. Ensure the directory containing the file is writable inside Docker or your host environment.

## Useful Scripts
- `npm run dev` – start the dev server with hot reload.
- `npm run build` – generate the production build.
- `npm run preview` – preview the production build locally.
- `npm run check` – type-check and lint the project.

## Docker
A multi-stage Dockerfile is included for production builds:
```bash
# Build the image
docker build -t organization-tool .

# Run the container (mounting the SQLite file for persistence)
docker run \
  -p 3000:3000 \
  -e DATABASE_URL=/data/local.db \
  -v $(pwd)/local.db:/data/local.db \
  organization-tool
```
By default the container listens on `PORT` (defaults to 3000). Adjust `DATABASE_URL` to point at the mounted SQLite file path inside the container.
