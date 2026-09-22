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

/**
 * The operations that read only the first number. Mirrors `Unary` in the calc
 * package, and it is the client's single source of truth for arity: the
 * request omits `b` for these, the response carries none, and the error text
 * for a missing field reads differently. Declared once, three things follow.
 */
export const UNARY_OPERATIONS = ['sqrt'] as const satisfies readonly Operation[]

export type UnaryOperation = (typeof UNARY_OPERATIONS)[number]
export type BinaryOperation = Exclude<Operation, UnaryOperation>

const UNARY = new Set<string>(UNARY_OPERATIONS)

export function isUnary(operation: Operation): operation is UnaryOperation {
  return UNARY.has(operation)
}

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

/**
 * The success body echoes the operands the operation took, and only those:
 * `b` is absent for a unary operation, because the request never carried one.
 * Optional here rather than a zero, so that "no second operand" and "a second
 * operand that happens to be zero" stay distinguishable on this side too.
 */
export interface CalculateSuccess {
  op: Operation
  a: number
  b?: number
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
 *
 * `b` is left out of the body entirely for a unary operation, whatever was
 * typed in the second box. Sending it would be asking the server to disregard
 * a number, and an empty box would then read as a missing field on an
 * operation that never wanted one.
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
      body: JSON.stringify(isUnary(op) ? { op, a } : { op, a, b }),
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
  if (
    typeof op !== 'string' ||
    !(OPERATIONS as readonly string[]).includes(op) ||
    typeof a !== 'number' ||
    typeof result !== 'number'
  ) {
    return null
  }

  const operation = op as Operation

  // A unary answer carries no second operand. One sent anyway is dropped here
  // rather than rejected, the same way an unknown field is: a server free to
  // add a field is the reason the client reads the shape it needs instead of
  // demanding the shape it expects.
  if (isUnary(operation)) {
    return { op: operation, a, result }
  }

  return typeof b === 'number' ? { op: operation, a, b, result } : null
}

function readErrorCode(body: unknown): string | null {
  if (!isRecord(body) || !isRecord(body.error)) return null
  return typeof body.error.code === 'string' ? body.error.code : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
