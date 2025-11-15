FROM node:22-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci

FROM deps AS build
WORKDIR /app

COPY . .

RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY package*.json ./
COPY drizzle ./drizzle
COPY docker-entrypoint.sh ./

RUN mkdir -p /data \
    && chmod +x docker-entrypoint.sh

VOLUME ["/data"]

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
