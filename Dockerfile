# Stage 1: Base
FROM node:22.12.0-alpine AS base

FROM base AS installer
WORKDIR /app
COPY package*.json ./
RUN npm install

FROM installer AS build
WORKDIR /app
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22.12.0-alpine AS runner
WORKDIR /app
COPY --from=build /app .
CMD ["node", "dist/src/main.js"]
