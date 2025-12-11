FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json

USER nextjs

# Ensure the pending resources directory exists and is writable by the
# runtime user. This makes it possible to mount a host volume there or
# allow a backend process to read files when the frontend image is used
# as a shared static files location.
RUN mkdir -p /app/public/pending-resources \
	&& chown -R nextjs:nodejs /app/public/pending-resources \
	&& chmod -R 775 /app/public/pending-resources

# Optional: declare a mount point so deployers can bind-mount a host
# directory to persist uploaded files. Do not rely on this creating
# persistent storage by itself in orchestrators.
VOLUME ["/app/public/pending-resources"]

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "start"]
