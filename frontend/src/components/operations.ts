// The catalogue behind the operation buttons: what each one is called, the
// symbol on its key, and how the expression reads once it has been applied.
// Both the button grid and the result panel read from here, so a label is
// written once.

import type { BinaryOperation, CalculateSuccess, Operation, UnaryOperation } from '../api/calculate.ts'
import { formatNumber } from '../lib/formatNumber.ts'

interface CommonDescriptor {
  /** The accessible name of the key. */
  label: string
  /** The glyph on the key. Decorative: the label is what is announced. */
  symbol: string
}

/**
 * A descriptor is tagged by arity, and its `operation` is typed by the same
 * arity, so the two cannot drift: an entry claiming to be unary while naming
 * a binary operation does not compile. The arity itself is declared in
 * `calculate.ts` and only used here.
 */
export type OperationDescriptor =
  | (CommonDescriptor & {
      arity: 'unary'
      operation: UnaryOperation
      /** How the applied operation reads back, e.g. "√9". */
      expression: (a: number) => string
    })
  | (CommonDescriptor & {
      arity: 'binary'
      operation: BinaryOperation
      /** How the applied operation reads back, e.g. "10 ÷ 4". */
      expression: (a: number, b: number) => string
    })

export const OPERATION_DESCRIPTORS: readonly OperationDescriptor[] = [
  {
    arity: 'binary',
    operation: 'add',
    label: 'Addition',
    symbol: '+',
    expression: (a, b) => `${formatNumber(a)} + ${formatNumber(b)}`,
  },
  {
    arity: 'binary',
    operation: 'subtract',
    label: 'Subtraction',
    symbol: '−',
    expression: (a, b) => `${formatNumber(a)} − ${formatNumber(b)}`,
  },
  {
    arity: 'binary',
    operation: 'multiply',
    label: 'Multiplication',
    symbol: '×',
    expression: (a, b) => `${formatNumber(a)} × ${formatNumber(b)}`,
  },
  {
    arity: 'binary',
    operation: 'divide',
    label: 'Division',
    symbol: '÷',
    expression: (a, b) => `${formatNumber(a)} ÷ ${formatNumber(b)}`,
  },
  {
    arity: 'binary',
    operation: 'power',
    label: 'Exponentiation',
    symbol: 'xʸ',
    expression: (a, b) => `${formatNumber(a)} ^ ${formatNumber(b)}`,
  },
  {
    // Square root reads the first number and nothing else. The second is not
    // sent, so there is none to read back here either.
    arity: 'unary',
    operation: 'sqrt',
    label: 'Square root',
    symbol: '√',
    expression: (a) => `√${formatNumber(a)}`,
  },
  {
    arity: 'binary',
    operation: 'percentage',
    label: 'Percentage',
    symbol: '%',
    expression: (a, b) => `${formatNumber(a)}% of ${formatNumber(b)}`,
  },
]

const BY_OPERATION = new Map(OPERATION_DESCRIPTORS.map((d) => [d.operation, d]))

function describeOperation(operation: Operation): OperationDescriptor | undefined {
  return BY_OPERATION.get(operation)
}

/**
 * How a result reads back, or undefined when there is nothing to read: an
 * operation this build does not know, or a binary answer that arrived without
 * its second operand. Both are answers the panel renders without an
 * expression rather than with a wrong one.
 */
export function expressionFor({ op, a, b }: CalculateSuccess): string | undefined {
  const descriptor = describeOperation(op)
  if (descriptor === undefined) return undefined

  if (descriptor.arity === 'unary') return descriptor.expression(a)

  return b === undefined ? undefined : descriptor.expression(a, b)
}
