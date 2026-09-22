# Conventions

## Backend (Go)

1. **Standard library only.** `net/http`, `encoding/json`, `math`, `testing`.
   `go.mod` has no dependencies, swagger is the exeption. If something seems to need a framework, the
   wrong problem is being solved.
2. **Every returned `error` is handled or propagated.** None is discarded with
   `_`.
3. **Table-driven tests.** A `[]struct` with case name, input and expected
   value, walked with `t.Run(c.name, …)`.
4. **Domain errors are typed values**, not formatted strings. The handler
   translates domain error to HTTP status; the calculation package does not know
   HTTP exists.
5. **Two packages**: `calc` never imports `net/http`; `api` never does
   arithmetic. If a `calc` test needs an `http.Request`, the separation broke.
6. **No `panic` on a request path.**
7. **The result is checked for finiteness before serialization.**
   `encoding/json` returns an error on `NaN` and `Inf`. It does not emit odd
   JSON, it fails. An unchecked infinity is a 500 on the endpoint the brief calls
   out by name.
8. `gofmt` and `go vet ./...` clean before every commit.

## Frontend (React + TypeScript)

1. **Strict TypeScript. Do not use `any` type.** The API response is typed once and reused.
2. **Errors are rendered from the `code`, never by comparing `message`.** A
   wording change on the server must not break the client.
3. **All three states exist in the UI**: loading, error, result. A button that
   stays enabled during an in-flight request is a double submit waiting to
   happen.
4. **Client validation front-runs server validation, it does not replace it.**
   The server validates all the same, and a test proves it.
5. **Genuinely responsive but minimal**: usable with a thumb on a phone. No
   design system, no component library.
6. Tests assert visible behaviour — type, submit, see the error — not component
   internals.

## Both sides of project, backend and frontend

1. **No dead code, no `TODO`, no unused sample files.** This is a small and
   deliverable project: everything present is present because it is needed.
2. **Commit messages say what changed and why**, not "wip" or "fix".
3. **No secrets, no envirment variables, not even sample ones.** The port comes from an environment
   variable with a default.

---

## How this file is used with the agent

1. It is given to the agent **before** any code is requested, not after something
   comes out wrong.
2. Generated code is read against the list. **What breaks a rule is rejected and
   asked for again, naming the rule**, not quietly patched by hand, because a
   silent hand-patch makes the next prompt repeat the mistake.
3. What was rejected, and why, is recorded. That is the substance of
   `PROMPTS.md`.
