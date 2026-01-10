FROM node:20-alpine AS build
WORKDIR /app
COPY apps/frontend/package*.json apps/frontend/
RUN cd apps/frontend && npm ci
COPY apps/frontend apps/frontend
ARG API_URL
WORKDIR /app/apps/frontend

RUN node -e "const fs=require('fs'); const p='src/environments/environment.prod.ts'; let s=fs.readFileSync(p,'utf8'); s=s.replace(/apiUrl:\\s*'[^']*'/, \"apiUrl: '\"+process.env.API_URL+\"'\"); fs.writeFileSync(p,s);" \
 && npm run build

FROM nginx:alpine
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html
EXPOSE 80
