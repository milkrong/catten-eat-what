FROM oven/bun:1.0.20

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Expose the port your app runs on
EXPOSE 3002

# Start the application
CMD ["bun", "run", "start"] 