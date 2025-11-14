FROM node:20-bookworm AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM deps AS build
WORKDIR /app
COPY . .
# Defaults only help the build stage; override them if needed when building.
ARG DATABASE_URL=/tmp/local.db
ARG WORKSPACE_TIMEZONE=UTC

# Inject a throwaway secret so the build can run; the real secret is provided at runtime.
RUN DATABASE_URL=${DATABASE_URL} \
    WORKSPACE_TIMEZONE=${WORKSPACE_TIMEZONE} \
    SESSION_SECRET=build-time-placeholder \
    npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    DATABASE_URL=/data/local.db \
    WORKSPACE_TIMEZONE=UTC

# SESSION_SECRET must be provided at runtime via `docker run -e SESSION_SECRET=...`.

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 svelte

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY package*.json ./

RUN mkdir -p /data && chown -R svelte:nodejs /data
VOLUME ["/data"]

USER svelte
EXPOSE 3000
CMD ["node", "build"]
