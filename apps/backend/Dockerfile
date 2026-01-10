FROM node:20-alpine AS deps
WORKDIR /app
COPY apps/backend/package*.json apps/backend/
RUN cd apps/backend && npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/apps/backend/node_modules apps/backend/node_modules
COPY apps/backend apps/backend
WORKDIR /app/apps/backend
RUN npm run build

FROM node:20-alpine
WORKDIR /app/apps/backend
COPY --from=build /app/apps/backend/dist dist
COPY --from=build /app/apps/backend/package*.json ./
COPY --from=build /app/apps/backend/node_modules node_modules

COPY apps/backend/prisma prisma
COPY apps/backend/prisma.config.ts ./

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
