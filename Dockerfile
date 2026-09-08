FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy dependency specifications
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application source code
COPY src/ ./src/
COPY .env.example ./.env.example

# Expose server port
EXPOSE 3000

# Set environment variable defaults
ENV PORT=3000
ENV NODE_ENV=production

# Start application
CMD ["node", "src/app.js"]
