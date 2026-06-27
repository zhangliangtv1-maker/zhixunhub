FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm" PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY .npmrc pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY lib/api-client-react/package.json lib/api-client-react/package.json
COPY lib/api-spec/package.json lib/api-spec/package.json
COPY lib/api-zod/package.json lib/api-zod/package.json
COPY lib/db/package.json lib/db/package.json
COPY scripts/package.json scripts/package.json
COPY artifacts/api-server/package.json artifacts/api-server/package.json
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM base AS build
COPY . .
RUN pnpm --filter @workspace/api-server run build

FROM node:22-slim
COPY --from=build /app/artifacts/api-server/dist /app/artifacts/api-server/dist
COPY --from=build /app/artifacts/api-server/node_modules /app/artifacts/api-server/node_modules
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/pnpm-lock.yaml /app/
COPY --from=build /app/package.json /app/
WORKDIR /app
EXPOSE 3000
CMD ["node", "--enable-source-maps", "artifacts/api-server/dist/index.mjs"]
