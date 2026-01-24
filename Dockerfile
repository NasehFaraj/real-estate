FROM node:20.19 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

FROM node:20.19-slim AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

RUN useradd -u 10001 -m appuser

COPY --from=builder /app/dist ./dist

RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 3000

CMD ["node", "dist/server.js"]
