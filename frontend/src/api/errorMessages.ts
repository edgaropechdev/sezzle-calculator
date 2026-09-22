// Error text is rendered from the machine-readable `code`, never by reading
// the server's `message`: a wording change on the server must not break the
// client, and the two sides stay free to word the same failure differently.

import { isUnary, type ApiErrorCode, type Operation, type TransportErrorCode } from './calculate.ts'

const MESSAGES: Record<ApiErrorCode | TransportErrorCode, string> = {
  invalid_json: 'The request could not be read. Try again.',
  missing_field: 'Enter a number in both fields.',
  unknown_operation: 'That operation is not available.',
  division_by_zero: 'Cannot divide by zero.',
  negative_sqrt: 'Cannot take the square root of a negative number.',
  result_not_finite: 'The result is too large to represent.',
  unreachable: 'Cannot reach the calculator service. Is the server running?',
  unexpected_response: 'The server answered in an unexpected way.',
}

/**
 * `missing_field` is the one code whose wording depends on the operation that
 * was asked for. A unary operation sends one number, so the only field it can
 * be missing is the first — telling someone to fill in both would point them
 * at a box the operation never reads.
 */
const MISSING_FIELD_UNARY = 'Enter a number in the first field.'

const FALLBACK = 'Something went wrong. Try again.'

/**
 * The fallback is mandatory, not defensive decoration: the server is free to
 * add a code after this bundle was built, and an unknown code must still
 * produce something a person can read.
 *
 * `operation` is the one that was attempted, not one read back off the answer:
 * a failed request has no operation in its body to read.
 */
export function messageForCode(code: string, operation: Operation): string {
  if (code === 'missing_field' && isUnary(operation)) {
    return MISSING_FIELD_UNARY
  }

  return Object.hasOwn(MESSAGES, code) ? MESSAGES[code as ApiErrorCode | TransportErrorCode] : FALLBACK
}
