FROM node:20-alpine
RUN apk add --no-cache openssl

EXPOSE 3000

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json* ./

RUN npm ci --omit=dev && npm cache clean --force

COPY . .

RUN npm run build

# prisma generate only needs the schema, not a real DB connection.
# Set a placeholder so schema validation passes at build time.
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost/placeholder" npx prisma generate

CMD ["npm", "run", "start"]
