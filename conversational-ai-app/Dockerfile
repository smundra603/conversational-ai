# Multi-stage build: build static assets with pnpm, serve via Nginx

# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies using pnpm
COPY package.json pnpm-lock.yaml ./
RUN corepack enable \
  && corepack prepare pnpm@latest --activate \
  && pnpm install --frozen-lockfile

# Copy source and build
COPY . .
RUN pnpm build

# --- Runtime stage ---
FROM nginx:alpine AS runtime

# Nginx config for SPA routing
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
