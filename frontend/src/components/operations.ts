// The catalogue behind the operation buttons: what each one is called, the
// symbol on its key, and how the expression reads once it has been applied.
// Both the button grid and the result panel read from here, so a label is
// written once.

import type { Operation } from '../api/calculate.ts'
import { formatNumber } from '../lib/formatNumber.ts'

export interface OperationDescriptor {
  operation: Operation
  /** The accessible name of the key. */
  label: string
  /** The glyph on the key. Decorative: the label is what is announced. */
  symbol: string
  /** How the applied operation reads back, e.g. "10 % of 200". */
  expression: (a: number, b: number) => string
}

export const OPERATION_DESCRIPTORS: readonly OperationDescriptor[] = [
  {
    operation: 'add',
    label: 'Addition',
    symbol: '+',
    expression: (a, b) => `${formatNumber(a)} + ${formatNumber(b)}`,
  },
  {
    operation: 'subtract',
    label: 'Subtraction',
    symbol: '−',
    expression: (a, b) => `${formatNumber(a)} − ${formatNumber(b)}`,
  },
  {
    operation: 'multiply',
    label: 'Multiplication',
    symbol: '×',
    expression: (a, b) => `${formatNumber(a)} × ${formatNumber(b)}`,
  },
  {
    operation: 'divide',
    label: 'Division',
    symbol: '÷',
    expression: (a, b) => `${formatNumber(a)} ÷ ${formatNumber(b)}`,
  },
  {
    operation: 'power',
    label: 'Exponentiation',
    symbol: 'xʸ',
    expression: (a, b) => `${formatNumber(a)} ^ ${formatNumber(b)}`,
  },
  {
    // Square root reads the first number only. The second is still sent,
    // because the request shape requires it.
    operation: 'sqrt',
    label: 'Square root',
    symbol: '√',
    expression: (a) => `√${formatNumber(a)}`,
  },
  {
    operation: 'percentage',
    label: 'Percentage',
    symbol: '%',
    expression: (a, b) => `${formatNumber(a)}% of ${formatNumber(b)}`,
  },
]

const BY_OPERATION = new Map(OPERATION_DESCRIPTORS.map((d) => [d.operation, d]))

export function describeOperation(operation: Operation): OperationDescriptor | undefined {
  return BY_OPERATION.get(operation)
}
