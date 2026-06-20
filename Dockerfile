# ══════════════════════════════════════════════
# IntellMeet — Multi-Stage Production Dockerfile
# ══════════════════════════════════════════════

# ─── Stage 1: Build Frontend ───
FROM node:20-alpine AS frontend-builder
WORKDIR /app

# Copy root package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copy source and build
COPY index.html vite.config.ts tsconfig*.json ./
COPY src/ src/
COPY public/ public/
RUN npm run build

# ─── Stage 2: Build Backend ───
FROM node:20-alpine AS backend-builder
WORKDIR /app/server

COPY server/package.json server/package-lock.json* ./
RUN npm ci --ignore-scripts

COPY server/ .
RUN npx tsc || true

# ─── Stage 3: Production ───
FROM node:20-alpine AS production
WORKDIR /app

# Security: run as non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S intellmeet -u 1001

# Install production dependencies only
COPY server/package.json server/package-lock.json* ./server/
RUN cd server && npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Copy built assets
COPY --from=frontend-builder /app/dist ./dist
COPY --from=backend-builder /app/server/dist ./server/dist
COPY --from=backend-builder /app/server/services ./server/services
COPY --from=backend-builder /app/server/models ./server/models
COPY --from=backend-builder /app/server/middleware ./server/middleware
COPY --from=backend-builder /app/server/routes ./server/routes
COPY --from=backend-builder /app/server/db ./server/db

# Create uploads directory
RUN mkdir -p /app/uploads && chown -R intellmeet:nodejs /app

USER intellmeet

# Environment
ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget -qO- http://localhost:5000/health || exit 1

CMD ["node", "server/dist/server.js"]
