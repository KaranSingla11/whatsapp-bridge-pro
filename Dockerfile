# Build stage for frontend
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build frontend (pass environment variables if available)
ARG GEMINI_API_KEY
ENV GEMINI_API_KEY=$GEMINI_API_KEY
RUN npm run build && ls -la dist/ || echo "Build failed or dist not found"

# Production stage
FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --production

# Create sessions directory
RUN mkdir -p ./sessions

# Copy built frontend from builder
COPY --from=builder /app/dist ./dist

# Copy server and manager files
COPY server.cjs .
COPY auto-reply-manager.cjs .

# Copy data files if they exist (create empty ones if missing)
RUN echo '[]' > api_keys.json || true
RUN echo '[]' > instances.json || true
RUN echo '[]' > auto_replies.json || true

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start the server
CMD ["npm", "start"]
