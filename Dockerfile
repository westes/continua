# Multi-stage: build the static bundle with Node, serve it with Caddy.
# Continua has no server-side logic — this container exists for operational
# consistency with the rest of the hub (docker-compose + Ansible role +
# systemd, same as eec/drip/bookshop), not because a live process is needed.
FROM node:26-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM caddy:alpine
COPY --from=build /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile
