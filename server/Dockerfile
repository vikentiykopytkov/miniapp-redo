FROM node:20-alpine as base
WORKDIR /app


# Устанавливаем зависимости
COPY server/package.json ./package.json
COPY server/tsconfig.json ./tsconfig.json
RUN npm install --production=false


# Копируем исходники и статику
COPY server/ ./server
COPY webapp/ ./webapp
COPY admin/ ./admin


# Сборка TypeScript
RUN npm run build


# Runtime слой
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production


COPY --from=base /app/package.json ./package.json
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/server/dist ./server/dist
COPY --from=base /app/server/migrations ./server/migrations
COPY --from=base /app/webapp ./webapp
COPY --from=base /app/admin ./admin


EXPOSE 8080
CMD ["node", "server/dist/server.js"]