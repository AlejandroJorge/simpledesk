FROM node:20-bookworm AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM deps AS build
WORKDIR /app
COPY . .
ARG AUTH=false
ARG APPLICATION_SECRET=
ARG DATABASE_URL=/tmp/local.db
ENV AUTH=${AUTH} \
    APPLICATION_SECRET=${APPLICATION_SECRET} \
    DATABASE_URL=${DATABASE_URL}
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    AUTH=false \
    APPLICATION_SECRET= \
    DATABASE_URL=/data/local.db

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 svelte

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY package*.json ./

RUN mkdir -p /data && chown -R svelte:nodejs /data
VOLUME ["/data"]

USER svelte
EXPOSE 3000
CMD ["node", "build"]
