# Stage 1: Build the frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for building)
RUN npm ci

# Copy source code
COPY . .

# Build the frontend
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy the built frontend from builder stage
COPY --from=builder /app/dist ./dist

# Copy all application files (filtered by .dockerignore)
# This ensures server, utils, scripts, sql folders are available
COPY . .

# Expose the port the server runs on
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production

# Start the server
CMD ["node", "server/index.js"]
