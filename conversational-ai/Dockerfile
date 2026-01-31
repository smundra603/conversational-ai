# syntax=docker/dockerfile:1

# Build stage: compile TypeScript to JS (dist)
FROM node:20-alpine AS builder
WORKDIR /usr/src/app

# Install dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy sources and build
COPY tsconfig.json ./
COPY src ./src
RUN yarn build

# Runtime stage: run compiled app with production deps
FROM node:20-alpine AS runner
ENV NODE_ENV=production
WORKDIR /usr/src/app

# Install only production dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production

# Copy built output from builder
COPY --from=builder /usr/src/app/dist ./dist

# Expose Fastify port
EXPOSE 3000

# Default environment (override in Compose/Env)
ENV SERVICE_NAME=conversational-ai \
  HOST=0.0.0.0 \
  PORT=3000 \
  LOG_LEVEL=info \
  CORS_ORIGIN=true

# Start server
CMD ["node", "dist/server.js"]
