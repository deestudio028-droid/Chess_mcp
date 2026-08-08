FROM mcr.microsoft.com/playwright:v1.49.0-noble

WORKDIR /app

# Install pnpm directly via npm to avoid corepack signature errors
RUN npm install -g pnpm

# Copy package dependencies
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy application source
COPY . .

# Railway environment configuration
ENV PORT=3001
ENV HEADLESS=true

EXPOSE 3001

# Start the MCP SSE server
CMD ["pnpm", "exec", "tsx", "index.ts"]
