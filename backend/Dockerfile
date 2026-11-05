FROM node:24-bookworm-slim AS base

WORKDIR /app

RUN apt-get update -y \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

FROM base AS build
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma

RUN npm ci

COPY . .

RUN npm run build \
    && cp -R generated/. dist/generated/

FROM build AS migration
USER node

FROM build AS production-dependencies
RUN npm prune --omit=dev --ignore-scripts

FROM base AS runtime
RUN mkdir -p /app/uploads \
    && chown node:node /app/uploads
COPY --from=production-dependencies /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
USER node

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
