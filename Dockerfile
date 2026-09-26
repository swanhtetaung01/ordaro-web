# syntax=docker/dockerfile:1
# The web app as a container: Next.js standalone output on Node 24. Multi-architecture base
# images, so it builds on an x86 laptop and on the ARM (Graviton) server alike.

FROM node:24-bookworm-slim AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack pnpm install --frozen-lockfile

FROM node:24-bookworm-slim AS build
WORKDIR /app
RUN corepack enable
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack pnpm build

FROM node:24-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN useradd --system --uid 10001 trillopos
COPY --from=build /app/public ./public
COPY --from=build --chown=trillopos /app/.next/standalone ./
COPY --from=build --chown=trillopos /app/.next/static ./.next/static
USER trillopos
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD node -e "fetch('http://localhost:3000/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "server.js"]
