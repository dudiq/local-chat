# Stage 1: Build React Frontend
FROM node:20-alpine as builder
WORKDIR /app/client
# Copy client configs
COPY client/package.json client/package-lock.json* ./
RUN npm install
# Copy client source
COPY client/ .
RUN npm run build

# Stage 2: Run Bun Server
FROM oven/bun:1
WORKDIR /app

# Copy server files
COPY server ./server

# Copy built frontend from first stage to public folder
COPY --from=builder /app/client/../public ./public

# Port
EXPOSE 3000

# Start
CMD ["bun", "./server/src/index.ts"]
