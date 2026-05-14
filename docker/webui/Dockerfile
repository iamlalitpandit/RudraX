# RudraX Web UI Dockerfile
# Multi-stage build for production

FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Production stage
FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/bin ./bin
COPY --from=builder /app/webui ./webui
COPY --from=builder /app/tools ./tools
COPY --from=builder /app/docs ./docs

# Install Socket.IO
RUN npm install socket.io

RUN addgroup -g 1001 -S rudrax && \
    adduser -S rudrax -u 1001 -G rudrax && \
    chown -R rudrax:rudrax /app

USER rudrax

EXPOSE 5555

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget -q -O /dev/null http://localhost:5555/api/health || exit 1

CMD ["node", "webui/server.js"]