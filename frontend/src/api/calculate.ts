// The typed client for POST /api/v1/calculate. It is the only module that
// knows the endpoint exists, and it never throws: every outcome — a 200, a
// documented 400, a server that is not running — comes back as a value, so a
// caller cannot compile without handling the failure branch.

/** The operations the API accepts. Mirrors the calc package's map. */
export const OPERATIONS = [
  'add',
  'subtract',
  'multiply',
  'divide',
  'power',
  'sqrt',
  'percentage',
] as const

export type Operation = (typeof OPERATIONS)[number]

/** Error codes the API documents. */
export type ApiErrorCode =
  | 'invalid_json'
  | 'missing_field'
  | 'unknown_operation'
  | 'division_by_zero'
  | 'negative_sqrt'
  | 'result_not_finite'

/**
 * Failures that never reach the API: the request could not be sent, or the
 * answer did not look like the contract. They are codes like any other so
 * that the UI has one path for rendering a failure.
 */
export type TransportErrorCode = 'unreachable' | 'unexpected_response'

/** The success body echoes the input next to the result. */
export interface CalculateSuccess {
  op: Operation
  a: number
  b: number
  result: number
}

/**
 * A discriminated union, not a thrown error. `code` is a plain string rather
 * than the union above: the server may grow a code this build has never heard
 * of, and the message map answers for it with a fallback instead of the UI
 * rendering nothing.
 */
export type CalculateOutcome =
  | { ok: true; value: CalculateSuccess }
  | { ok: false; code: string }

const ENDPOINT = '/api/v1/calculate'

/**
 * `a` and `b` are `number | null`. Null is what the client sends for a field
 * it cannot express as a JSON number — an empty box, or text that is not a
 * number. That is transport, not validation: null arrives at the server as an
 * absent operand and the server answers `missing_field`, which is the error
 * the user sees. No number rule is decided here.
 */
export async function calculate(
  op: Operation,
  a: number | null,
  b: number | null,
  signal?: AbortSignal,
): Promise<CalculateOutcome> {
  let response: Response
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ op, a, b }),
      signal,
    })
  } catch {
    return { ok: false, code: 'unreachable' }
  }

  let body: unknown
  try {
    body = await response.json()
  } catch {
    return { ok: false, code: 'unexpected_response' }
  }

  if (!response.ok) {
    return { ok: false, code: readErrorCode(body) ?? 'unexpected_response' }
  }

  const value = readSuccess(body)
  return value === null ? { ok: false, code: 'unexpected_response' } : { ok: true, value }
}

function readSuccess(body: unknown): CalculateSuccess | null {
  if (!isRecord(body)) return null

  const { op, a, b, result } = body
  const isShaped =
    typeof op === 'string' &&
    typeof a === 'number' &&
    typeof b === 'number' &&
    typeof result === 'number' &&
    (OPERATIONS as readonly string[]).includes(op)

  return isShaped ? { op: op as Operation, a, b, result } : null
}

function readErrorCode(body: unknown): string | null {
  if (!isRecord(body) || !isRecord(body.error)) return null
  return typeof body.error.code === 'string' ? body.error.code : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
