# Use Node.js 22 LTS
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Install dependencies for native modules (if any)
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S rudrax && \
    adduser -S rudrax -u 1001 && \
    chown -R rudrax:rudrax /app

USER rudrax

# Default command
CMD ["node", "bin/rudrax", "--help"]
