FROM node:22-slim AS base
WORKDIR /app
ENV PNPM_HOME="/pnpm" PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm@10
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY lib/api-client-react/package.json lib/api-client-react/package.json
COPY lib/api-spec/package.json lib/api-spec/package.json
COPY lib/api-zod/package.json lib/api-zod/package.json
COPY lib/db/package.json lib/db/package.json
COPY scripts/package.json scripts/package.json
COPY artifacts/api-server/package.json artifacts/api-server/package.json
RUN pnpm install --no-frozen-lockfile

FROM base AS build
WORKDIR /app
COPY . .
RUN pnpm --filter @workspace/api-server run build

FROM node:22-slim
WORKDIR /app
COPY --from=build /app/artifacts/api-server/dist ./artifacts/api-server/dist
COPY --from=build /app/artifacts/api-server/node_modules ./artifacts/api-server/node_modules
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json .
EXPOSE 3000
CMD ["node", "--enable-source-maps", "artifacts/api-server/dist/index.mjs"]
