# Multi-stage: build the static bundle with Node, serve it with Caddy.
# Continua has no server-side logic — this container exists for operational
# consistency with the rest of the hub (docker-compose + Ansible role +
# systemd, same as eec/drip/bookshop), not because a live process is needed.
FROM node:26-alpine AS build
# git is needed at build time only, not to run the app -- vite.config.ts
# reads the app's version from a git tag via `git describe` (see
# CLAUDE.md's "Versioning" section), which node:26-alpine doesn't ship.
RUN apk add --no-cache git
# COPY preserves the build context's file ownership as-is, which on the hub
# deploy host (git checkout owned by whichever user ran the last `git
# fetch`/`merge`) won't generally match this stage's own root user -- git
# refuses to operate on a repo it doesn't own unless told it's safe to.
RUN git config --global --add safe.directory /app
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM caddy:alpine
COPY --from=build /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile
