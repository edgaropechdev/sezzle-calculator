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

The different `op` options:

```go
	Add        Op = "add"
	Subtract   Op = "subtract"
	Multiply   Op = "multiply"
	Divide     Op = "divide"
	Power      Op = "power"
	Sqrt       Op = "sqrt"
	Percentage Op = "percentage"
```

```bash
curl -X POST http://localhost:3000/api/v1/calculate \
  -H 'Content-Type: application/json' \
  -d '{"op":"divide","a":10,"b":4}'
```

```json
{ "op": "divide", "a": 10, "b": 4, "result": 2.5 }
```

`sqrt` reads one number, so it takes one and answers with one:

```bash
curl -X POST http://localhost:3000/api/v1/calculate \
  -H 'Content-Type: application/json' \
  -d '{"op":"sqrt","a":9}'
```

```json
{ "op": "sqrt", "a": 9, "result": 3 }
```

Operations: `add`, `subtract`, `multiply`, `divide`, `power`, `sqrt`,
`percentage`. Invalid input answers `400` with `{"error":{"code":"…","message":"…"}}`.

## Design decisions

**One endpoint instead of seven.** `POST /api/v1/calculate` carries the
operation in the body, rather than exposing `/add`, `/subtract`, and so on.
Seven routes would mean seven validation paths and seven error paths, and a
client that grows every time an operation is added

**Operands decode into `*float64`, not `float64`.** This is the single most
important decision in the backend. With a plain `float64`, an absent field and a
zero field both arrive as `0` and it is different than a `null` or `Infinite`.

## Assumptions
1. **`percentage` means "a percent of b"**: `{"op":"percentage","a":10,"b":200}`
   returns `20`. The brief says "Percentage" without defining it. The other
   reading — what percent `a` is of `b` — is a division, and `divide` covers it.
2. **`sqrt` takes a single operand.** `b` is neither required nor echoed back:
   `{"op":"sqrt","a":9}` is a complete request, and the answer omits the field
   rather than reporting a `0` the client never sent. A `b` sent anyway is
   disregarded, not rejected, which is assumption 3.
3. **Unknown JSON fields are ignored, not rejected**, so a newer client can talk
   to an older server.
4. **An unknown `op` is reported as unknown even when operands are missing.**
   `{"op":"modulo","a":10}` answers `unknown_operation`, not `missing_field`:
   until the operation is known, nothing is known about which operands it
   needed. 