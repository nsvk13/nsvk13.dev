FROM oven/bun:1 AS builder
WORKDIR /usr/src/app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY . .
RUN bun run build

FROM oven/bun:1 AS runner
WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/.next ./.next
COPY --from=builder /usr/src/app/public ./public
COPY --from=builder /usr/src/app/next.config.mjs ./next.config.mjs
COPY --from=builder /usr/src/app/package.json ./package.json
COPY --from=builder /usr/src/app/bun.lock ./bun.lock

EXPOSE 3000

CMD ["bun", "run", "start"]