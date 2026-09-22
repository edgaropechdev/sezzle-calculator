// The display. It renders one of the four states the calculator can be in,
// and it is the only place an outcome becomes words.
//
// Error text comes from the code, never from the server's message: see
// errorMessages.ts.

import { messageForCode } from '../api/errorMessages.ts'
import type { CalculatorState } from '../hooks/useCalculator.ts'
import { formatNumber } from '../lib/formatNumber.ts'
import { describeOperation } from './operations.ts'
import styles from './ResultPanel.module.css'

interface ResultPanelProps {
  state: CalculatorState
}

export function ResultPanel({ state }: ResultPanelProps) {
  return (
    <output className={styles.panel} aria-live="polite" aria-busy={state.status === 'loading'}>
      {renderState(state)}
    </output>
  )
}

function renderState(state: CalculatorState) {
  switch (state.status) {
    case 'idle':
      return <p className={styles.hint}>Enter two numbers and choose an operation.</p>

    case 'loading':
      return <p className={styles.hint}>Calculating…</p>

    case 'success': {
      const descriptor = describeOperation(state.value.op)
      return (
        <>
          {descriptor && (
            <p className={styles.expression}>{descriptor.expression(state.value.a, state.value.b)}</p>
          )}
          <p className={styles.result}>{formatNumber(state.value.result)}</p>
        </>
      )
    }

    case 'error':
      return <p className={styles.error}>{messageForCode(state.code)}</p>
  }
}
