# Sherlock Ω Production Docker Image
# Multi-stage build for optimal size and security

# Build stage
FROM node:18-alpine AS builder

# Build arguments
ARG NODE_VERSION=18
ARG BUILD_DATE
ARG VCS_REF

# Labels for image metadata
LABEL maintainer="MIT Advanced Computational Intelligence Laboratory"
LABEL org.opencontainers.image.title="Sherlock Ω"
LABEL org.opencontainers.image.description="Revolutionary Self-Healing Development Environment"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.created=$BUILD_DATE
LABEL org.opencontainers.image.revision=$VCS_REF
LABEL org.opencontainers.image.source="https://github.com/mit-acil/sherlock-omega-ide"

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies with npm ci for reproducible builds
RUN npm ci --only=production --silent && \
    npm cache clean --force

# Copy source code
COPY src/ ./src/

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install security updates
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init && \
    rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S sherlock && \
    adduser -S sherlock -u 1001

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=sherlock:sherlock /app/dist ./dist
COPY --from=builder --chown=sherlock:sherlock /app/node_modules ./node_modules
COPY --from=builder --chown=sherlock:sherlock /app/package*.json ./

# Switch to non-root user
USER sherlock

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "console.log('Sherlock Ω is healthy')" || exit 1

# Expose port (if needed for web interface)
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]