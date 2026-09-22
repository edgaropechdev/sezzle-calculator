# Sezzle Calculator

A calculator with a Go HTTP API and a React + TypeScript frontend. Both sides
ship as containers, so the whole thing runs with one command.

## Requirements

**Docker Desktop** (or Docker Engine with the Compose v2 plugin) — nothing else.
Go, Node and npm are only needed to run the services outside of Docker; the
images build them internally.

Check what you have:

```bash
docker --version
docker compose version
```

macOS (homebrew): `brew install --cask docker`.

## Run

From the repository root:

```bash
docker compose up --build
```

Open <http://localhost:3000>.

The first build compiles the Go binary and the Vite bundle and runs both test
suites, so it takes a minute; later builds reuse the layer cache.

Stop with `Ctrl+C`, then `docker compose down` to remove the containers.

## What is running

| Service | Image | Port |
|---|---|---|
| `frontend` | nginx serving the built static files | `3000` → `80` |
| `backend` | Go API | `8080`, internal only |

The backend port is not published to the host. nginx proxies `/api/` to
`backend:8080` over the Compose network, so the page and the API share an
origin and no CORS headers are needed.

## API

One endpoint: `POST /api/v1/calculate`. Through the frontend container:

```bash
curl -X POST http://localhost:3000/api/v1/calculate \
  -H 'Content-Type: application/json' \
  -d '{"op":"divide","a":10,"b":4}'
```

```json
{ "op": "divide", "a": 10, "b": 4, "result": 2.5 }
```

Operations: `add`, `subtract`, `multiply`, `divide`, `power`, `sqrt`,
`percentage`. Invalid input answers `400` with `{"error":{"code":"…","message":"…"}}`.
