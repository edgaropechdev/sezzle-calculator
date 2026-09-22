// The result panel reads an expression back to the user — "10 ÷ 4" — and the
// two cases that matter are the ones where it must read nothing at all: an
// operation this build does not know, and a binary answer that arrived
// without its second operand. Rendering "10 ÷ undefined" would be worse than
// rendering the bare result, which is what returning undefined buys.

import { describe, expect, it } from 'vitest'

import { OPERATIONS, type CalculateSuccess, type Operation } from '../../src/api/calculate.ts'
import { OPERATION_DESCRIPTORS, expressionFor } from '../../src/components/operations.ts'

describe('OPERATION_DESCRIPTORS', () => {
  it('describes every operation the client can send, exactly once', () => {
    const described = OPERATION_DESCRIPTORS.map((d) => d.operation)

    expect([...described].sort()).toEqual([...OPERATIONS].sort())
    expect(new Set(described).size).toBe(described.length)
  })

  it('gives every key a label and a symbol', () => {
    for (const descriptor of OPERATION_DESCRIPTORS) {
      expect(descriptor.label).not.toBe('')
      expect(descriptor.symbol).not.toBe('')
    }
  })

  it('reads every operation back as a non-empty expression', () => {
    // Every entry in the catalogue, not a sample: an expression that throws or
    // comes back empty is a panel that renders nothing for that one key, and
    // the arithmetic would still look correct while it happened.
    for (const descriptor of OPERATION_DESCRIPTORS) {
      const answer: CalculateSuccess =
        descriptor.arity === 'unary'
          ? { op: descriptor.operation, a: 9, result: 3 }
          : { op: descriptor.operation, a: 10, b: 4, result: 0 }

      expect(expressionFor(answer)).not.toBe('')
      expect(expressionFor(answer)).toBeDefined()
    }
  })
})

describe('expressionFor', () => {
  it('reads a binary operation back with both operands', () => {
    expect(expressionFor({ op: 'divide', a: 10, b: 4, result: 2.5 })).toBe('10 ÷ 4')
    expect(expressionFor({ op: 'percentage', a: 10, b: 200, result: 20 })).toBe('10% of 200')
  })

  it('reads a unary operation back with one operand, ignoring a stray second', () => {
    expect(expressionFor({ op: 'sqrt', a: 9, result: 3 })).toBe('√9')
    expect(expressionFor({ op: 'sqrt', a: 9, b: 7, result: 3 })).toBe('√9')
  })

  it('formats the operands rather than printing them raw', () => {
    expect(expressionFor({ op: 'add', a: 0.1, b: 0.2, result: 0.30000000000000004 })).toBe(
      '0.1 + 0.2',
    )
  })

  it('reads nothing for a binary answer that arrived without its second operand', () => {
    expect(expressionFor({ op: 'divide', a: 10, result: 2.5 })).toBeUndefined()
  })

  it('reads nothing for an operation this build does not know', () => {
    // Reachable when a newer server answers with an operation this bundle
    // predates. The panel then shows the result and no expression.
    const fromTheFuture = { op: 'modulo' as Operation, a: 10, b: 4, result: 2 }

    expect(expressionFor(fromTheFuture satisfies CalculateSuccess)).toBeUndefined()
  })
})
