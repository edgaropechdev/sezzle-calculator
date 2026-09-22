// Rounding for a human happens here and nowhere else: the API answers
// 0.30000000000000004 for 0.1 + 0.2 on purpose. These cases pin the two
// things the screen depends on — that the float noise is gone, and that a
// number the user typed is not silently truncated.

import { describe, expect, it } from 'vitest'

import { formatNumber } from '../../src/lib/formatNumber.ts'

describe('formatNumber', () => {
  it('drops the float noise the API deliberately keeps', () => {
    expect(formatNumber(0.1 + 0.2)).toBe('0.3')
  })

  it('keeps an exact integer exact', () => {
    expect(formatNumber(42)).toBe('42')
    expect(formatNumber(0)).toBe('0')
  })

  it('keeps a negative sign', () => {
    expect(formatNumber(-2.5)).toBe('-2.5')
  })

  it('keeps ten fraction digits and rounds the eleventh', () => {
    // The cut is a display decision, not a loss of precision in the result:
    // the number itself travelled intact and only the reading is shortened.
    expect(formatNumber(0.12345678901234)).toBe('0.123456789')
  })
})
