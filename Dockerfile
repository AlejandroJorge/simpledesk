FROM node:22-alpine AS deps
WORKDIR /app

ENV NODE_ENV=development

COPY package*.json ./
RUN npm ci

FROM deps AS build
WORKDIR /app

COPY . .

# Defaults to handle build stage; Will be overriden
ARG DATABASE_URL=/tmp/local.db
ARG WORKSPACE_TIMEZONE=UTC

# Secret is a throwaway
ENV DATABASE_URL=${DATABASE_URL} \
    WORKSPACE_TIMEZONE=${WORKSPACE_TIMEZONE} \
    SESSION_SECRET=build-time-placeholder

RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

# SESSION_SECRET will be provided at runtime via env.
ENV NODE_ENV=production \
    DATABASE_URL=/data/local.db \
    WORKSPACE_TIMEZONE=UTC

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY package*.json ./
COPY drizzle ./drizzle
COPY docker-entrypoint.sh ./

RUN mkdir -p /data \
    && chmod +x docker-entrypoint.sh

VOLUME ["/data"]

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "build"]
