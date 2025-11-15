# SimpleDesk
Organization tool for managing notes and tasks. 

Docker compose file provided as example to configure

Docker image can be found [here](https://hub.docker.com/repository/docker/jorgealejandro/simpledesk/general)

## Requirements
- Node.js 22+
- npm 10+
- SQLite

## Relevant environment variables (docker-compose.yml)
- `DATA_DIR`: Directory of the sqlite database file
- `WORKSPACE_TIMEZONE`: Timezone for due dates (eg. UTC)
- `SESSION_SECRET`: Secret for auth handling
