# Continua

A static, offline-first PWA for praying the Divine Office: Matins, Lauds, Prime, Terce, Sext,
None, Vespers, and Compline, in bilingual Latin/English, for any given date.

This isn't a reconstruction of any single historical breviary. It's a personal design that
draws on several historical sources without reproducing any one of them exactly: hour
structure chiefly from the Monastic Tridentinum (1617), precedence/rubrics from Divino
Afflatu, and a calendar merged from both the Tridentine 1906 and Divino Afflatu calendars,
with more generous handling of commemorations and octaves than any one historical rite used.
See the project's own design notes for the full rationale if you're extending it.

There's no backend and no database. Everything is a pre-built static bundle, and the app is
designed to keep working fully offline once it's been loaded once.

## Development

Requires Node.js (developed against Node 26).

```sh
npm install
npm run dev        # start the Vite dev server
npm run build       # type-check (tsc --noEmit) and produce a production build in dist/
npm run preview     # serve the production build locally
npm test            # run the test suite (vitest)
```

Run a single test file or a subset by name:

```sh
npx vitest run tests/hours/vespers.test.ts
npx vitest run -t "some test name"
```

### Dev server in Docker

`docker-compose.dev.yml` runs the Vite dev server in a container with the repo bind-mounted, so
edits on disk hot-reload live. This is separate from the production `docker-compose.yml` below.

```sh
docker compose -f docker-compose.dev.yml up
```

This serves the dev server on `http://localhost:5174`.

## Running in production

The app is entirely static once built, so "running it" just means serving `dist/`, on any static
file host that falls back to `index.html` for unknown paths (the app does its own client-side
routing for URLs like `/2026-08-09/prime`).

### Docker

A `Dockerfile` builds the static bundle with Node and serves it with Caddy:

```sh
docker build -t continua .
docker run -p 8080:80 continua
```

Or with Docker Compose (`docker-compose.yml` is included):

```sh
docker compose up -d --build
```

This serves the app on `http://localhost:8080`. Put a reverse proxy/TLS terminator in front of
it for a real deployment; the container itself just listens on port 80 internally and has no
configuration, secrets, or external dependencies.

### Without Docker

Any static file server works: build the app, then serve `dist/` with SPA-style fallback
routing. For example, with Caddy directly:

```sh
npm run build
caddy file-server --root dist --listen :8080
```

(For a real deployment you'll want a fallback rule so unknown paths resolve to `index.html`;
see the `Caddyfile` in this repo for the pattern.)
