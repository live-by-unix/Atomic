FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Create voicemail directory
RUN mkdir -p voicemail

# Expose port
EXPOSE 3001

# Set permissions for voicemail directory
RUN chmod 755 voicemail

# Start the application
CMD ["npm", "start"]
