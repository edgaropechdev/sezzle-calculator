// Error text is rendered from the machine-readable `code`, never by reading
// the server's `message`: a wording change on the server must not break the
// client, and the two sides stay free to word the same failure differently.

import type { ApiErrorCode, TransportErrorCode } from './calculate.ts'

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

const FALLBACK = 'Something went wrong. Try again.'

/**
 * The fallback is mandatory, not defensive decoration: the server is free to
 * add a code after this bundle was built, and an unknown code must still
 * produce something a person can read.
 */
export function messageForCode(code: string): string {
  return Object.hasOwn(MESSAGES, code) ? MESSAGES[code as ApiErrorCode | TransportErrorCode] : FALLBACK
}
