# Stage 1: Build React Frontend
FROM node:20-alpine AS builder
ENV CI=true
RUN corepack enable && corepack prepare pnpm@10.18.3 --activate

# Copy client files first
WORKDIR /app
COPY client ./client

# Install dependencies and build
WORKDIR /app/client
RUN pnpm install --frozen-lockfile
RUN pnpm build

# Stage 2: Run Bun Server
FROM oven/bun:alpine AS runner
WORKDIR /app/server

# Copy server files
COPY server ./

# Copy built frontend from builder stage
COPY --from=builder /app/server/public ./public

# Port
EXPOSE 3000

# Start
CMD ["bun", "./src/index.ts"]
