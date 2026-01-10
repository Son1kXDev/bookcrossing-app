FROM node:20-alpine AS build
WORKDIR /app
COPY apps/frontend/package*.json apps/frontend/
RUN cd apps/frontend && npm ci
COPY apps/frontend apps/frontend
WORKDIR /app/apps/frontend
RUN npm run build

FROM nginx:alpine
COPY apps/frontend/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html
COPY apps/frontend/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENV API_URL=http://localhost:3000
EXPOSE 80
CMD ["/docker-entrypoint.sh"]
