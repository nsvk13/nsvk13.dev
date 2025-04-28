# --- Build project ---
FROM oven/bun:1.2.10 as builder

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install

COPY . .

RUN bun build

# --- Deploy project ---
FROM oven/bun:1.2.10-slim

WORKDIR /app

COPY --from=builder /app/.next .next
COPY --from=builder /app/public public
COPY --from=builder /app/package.json .
COPY --from=builder /app/bun.lock .
COPY --from=builder /app/node_modules node_modules

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["bun", "start"]