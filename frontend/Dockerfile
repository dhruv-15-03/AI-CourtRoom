# Multi-stage build: compile the CRA app, then serve the static bundle with nginx.
# REACT_APP_* vars are baked in at build time (CRA requirement) -- pass them as
# build args from docker-compose.yml, not as runtime environment variables.

FROM node:20-alpine AS build
WORKDIR /app

ARG REACT_APP_API_URL=http://localhost:8081
ARG REACT_APP_AI_API_URL=https://ai-court-ai.onrender.com/api
ARG REACT_APP_WS_URL=http://localhost:8081/ws
ENV REACT_APP_API_URL=$REACT_APP_API_URL \
    REACT_APP_AI_API_URL=$REACT_APP_AI_API_URL \
    REACT_APP_WS_URL=$REACT_APP_WS_URL \
    REACT_APP_ENABLE_AI_FEATURES=true \
    REACT_APP_ENABLE_CHAT=true \
    REACT_APP_DEBUG=false

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1
