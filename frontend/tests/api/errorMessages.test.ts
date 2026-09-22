// The message map answers for every documented code and for codes it has never
// heard of. `missing_field` is the one whose wording depends on the operation:
// pointing someone at a second box that the operation never reads is the bug
// this file exists to catch.

import { describe, expect, it } from 'vitest'

import { OPERATIONS, type Operation } from '../../src/api/calculate.ts'
import { messageForCode } from '../../src/api/errorMessages.ts'

const DOCUMENTED_CODES = [
  'invalid_json',
  'missing_field',
  'unknown_operation',
  'division_by_zero',
  'negative_sqrt',
  'result_not_finite',
  'unreachable',
  'unexpected_response',
]

describe('messageForCode', () => {
  it.each(DOCUMENTED_CODES)('%s reads as a sentence', (code) => {
    const message = messageForCode(code, 'add')

    expect(message).not.toBe('')
    expect(message.endsWith('.') || message.endsWith('?')).toBe(true)
  })

  it.each([...OPERATIONS])('answers for %s with every documented code', (operation: Operation) => {
    for (const code of DOCUMENTED_CODES) {
      expect(messageForCode(code, operation)).not.toBe('')
    }
  })

  it('names one field for a unary operation and both for a binary one', () => {
    expect(messageForCode('missing_field', 'sqrt')).toBe('Enter a number in the first field.')
    expect(messageForCode('missing_field', 'divide')).toBe('Enter a number in both fields.')
  })

  it('falls back for a code this build has never heard of', () => {
    expect(messageForCode('not_a_code_yet', 'add')).toBe('Something went wrong. Try again.')
    // The fallback is reached by arity too: an unknown code is not special-cased
    // into the unary branch.
    expect(messageForCode('not_a_code_yet', 'sqrt')).toBe('Something went wrong. Try again.')
  })
})
