# Stage 1: Build Environment
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# Stage 2: Production Environment
FROM node:22-alpine AS runner

WORKDIR /app

# Run as a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy package.json and install only production dependencies
COPY package*.json ./
RUN npm install --only=production && npm cache clean --force

# Copy built artifacts from the builder stage
COPY --from=builder /app/dist ./dist

# Set permissions
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 4007
ENV NODE_ENV=production
ENV PORT=4007

CMD ["node", "dist/index.js"]
