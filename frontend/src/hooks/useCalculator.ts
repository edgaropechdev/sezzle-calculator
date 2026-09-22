// The calculator's state machine. It owns the two operands, the in-flight
// request and the outcome; the components below it render and nothing else.

import { useCallback, useRef, useState } from 'react'
import { calculate, type CalculateSuccess, type Operation } from '../api/calculate.ts'

/**
 * Every state the screen can be in. A union rather than three booleans, so
 * "loading with a stale result still on screen" cannot be represented.
 */
export type CalculatorState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; value: CalculateSuccess }
  | { status: 'error'; code: string }

export interface Calculator {
  a: string
  b: string
  state: CalculatorState
  setA: (value: string) => void
  setB: (value: string) => void
  apply: (operation: Operation) => void
}

export function useCalculator(): Calculator {
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [state, setState] = useState<CalculatorState>({ status: 'idle' })

  // Guards against a slow answer overwriting a fast one. The buttons are
  // disabled while a request is in flight, so this should not happen — but
  // "should not" is not the same as cannot, and the cost of being sure is a
  // ref and one comparison.
  const requestId = useRef(0)

  const apply = useCallback(
    (operation: Operation) => {
      const id = ++requestId.current
      setState({ status: 'loading' })

      void calculate(operation, toOperand(a), toOperand(b)).then((outcome) => {
        if (id !== requestId.current) return
        setState(outcome.ok ? { status: 'success', value: outcome.value } : { status: 'error', code: outcome.code })
      })
    },
    [a, b],
  )

  return { a, b, state, setA, setB, apply }
}

/**
 * Turns what was typed into something JSON can carry in a number field.
 *
 * This is not validation. Nothing here decides whether a number is acceptable
 * — not an empty box, not a negative square root, not a zero divisor. JSON
 * simply has no way to put "abc" in a numeric field, so anything that is not
 * a finite number travels as null, reaches the server as an absent operand,
 * and comes back as the server's own `missing_field` error.
 */
function toOperand(raw: string): number | null {
  const trimmed = raw.trim()
  if (trimmed === '') return null

  const value = Number(trimmed)
  return Number.isFinite(value) ? value : null
}
