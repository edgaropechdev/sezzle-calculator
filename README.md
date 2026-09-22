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

## Tests and coverage

Both suites run without Docker and without a network. They are also run inside
the images at build time, so `docker compose up --build` fails if either is red.

**Backend** — table-driven tests over the arithmetic and the HTTP boundary:

```bash
cd backend
go test ./... -cover                       # the numbers below
go test ./internal/... -coverprofile=coverage.out && go tool cover -html=coverage.out
```

| Package | Statements | What it covers |
|---|---|---|
| `internal/calc` | **96.0%** | The seven operations and their edge cases: division by zero, negative square root, a result that is not finite |
| `internal/api` | **88.9%** | Decoding, validation, every documented error code, the status and `Content-Type` of each answer, and the guard on the method |
| **Total (`internal/...`)** | **89.7%** | 8 test functions, 64 table cases |

`cmd/server` is not measured: it is the wiring — flags, timeouts, signal
handling — and a test of it would assert that `http.Server` works.

**Frontend** — the same idea on the client's logic:

```bash
cd frontend
npm install
npm test                                   # 44 tests, 4 files
npm run test:coverage                      # writes coverage/index.html
```

| File | Statements | Branches | What it covers |
|---|---|---|---|
| `api/calculate.ts` | 96.4% | 89.3% | The request body per arity, every answer shape, and a server that is unreachable or answers something unexpected |
| `api/errorMessages.ts` | 100% | 100% | Wording for every documented code, and the fallback for a code this build predates |
| `components/operations.ts` | 100% | 100% | The operation catalogue, and how each result reads back |
| `lib/formatNumber.ts` | 100% | — | Display rounding: the API returns `0.30000000000000004`, the screen shows `0.3` |
| **Total** | **98.1%** | **92.5%** | Functions 100%, lines 100% |

(The terminal table omits files already at 100%; `coverage/index.html` lists
all four.)

**What is not unit-tested, and why.** The React components and the
`useCalculator` hook that drives them. Every decision they could get wrong —
what to send, what an error says, how a result reads — lives in the modules
above and is tested there; what is left is rendering, and covering it means
adding a DOM harness. With the time this exercise asks for, the tests went
where a bug would be silent rather than visible.

## Design decisions

**One endpoint instead of seven.** `POST /api/v1/calculate` carries the
operation in the body, rather than exposing `/add`, `/subtract`, and so on.
Seven routes would mean seven validation paths and seven error paths, and a
client that grows every time an operation is added.

**Operands decode into `*float64`, not `float64`.** This is the single most
important decision in the backend. With a plain `float64`, an absent field and a
field sent as `0` both arrive as `0`, and the server cannot tell "the client
forgot the divisor" from "the client asked to divide by zero" — two different
answers, `missing_field` and `division_by_zero`. A pointer keeps the
distinction: `nil` means the field was absent or `null`. It also keeps
`encoding/json` honest about what it cannot carry, since JSON has no way to
express `NaN` or infinity in a numeric field.

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

## Prompts and AI tooling

The brief invites AI assistance and asks for the prompts used, so the whole
harness is in the repository:

- **[`PROMPTS.raw.md`](PROMPTS.raw.md)** — every prompt typed, unedited, with
  its timestamp: 14 prompts across 5 sessions. Extracted from the session logs
  by [`extract-prompts.py`](extract-prompts.py), which reads only the turns a
  person wrote.
- **[`CONVENTIONS.md`](CONVENTIONS.md)** — the coding standard the agent was
  given before the first prompt: standard library only, table-driven tests,
  the arithmetic kept clear of HTTP.
- **[`CLAUDE.md`](CLAUDE.md)** — the instructions that carried the frozen API
  contract between sessions, so the two sides could not drift apart.

The contract was written before the code, and the tests were written against
the contract rather than against what the implementation happened to do.
