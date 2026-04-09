FROM node:20-alpine
RUN apk add --no-cache openssl

# Render uses port 10000
EXPOSE 10000

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies needed for build)
RUN npm ci && npm cache clean --force

COPY . .

# Generate Prisma Client at build time with placeholder URL
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost/placeholder" npx prisma generate

# Build the app after Prisma Client is generated
RUN npm run build

# Copy and set up entrypoint script
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Use entrypoint script to run migrations then start the app at container startup
ENTRYPOINT ["/app/entrypoint.sh"]
