FROM node:20-alpine
RUN apk add --no-cache openssl

# Render dùng port 10000, không phải 3000
EXPOSE 10000

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json* ./

# Cài TẤT CẢ dependencies (bao gồm devDependencies) vì cần để build
RUN npm ci && npm cache clean --force

COPY . .

# 1. Generate Prisma Client trước (dùng placeholder vì build phase chưa có DB)
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost/placeholder" npx prisma generate

# 2. Build app sau khi đã có Prisma Client
RUN npm run build

# 3. Migrate + Start ở runtime — lúc này DATABASE_URL thật đã được inject
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
