FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY shared/package.json shared/package.json
COPY server/package.json server/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY tsconfig.base.json ./
COPY shared shared
COPY server server
RUN pnpm --filter @kairos/shared build
RUN pnpm --filter @kairos/server build
RUN pnpm --filter @kairos/server deploy --legacy --prod /prod/server

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /prod/server ./
CMD ["node", "dist/api/server.js"]
