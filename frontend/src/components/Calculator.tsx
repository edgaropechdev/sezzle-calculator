// The calculator itself: display, two operands, one key per operation.
//
// There is no form and no Enter-to-submit, because there is no default
// operation to submit to — the key that is pressed *is* the choice. There is
// also no "equals": the same reason.

import { useCalculator } from '../hooks/useCalculator.ts'
import { NumberField } from './NumberField.tsx'
import { OperationKeypad } from './OperationKeypad.tsx'
import { ResultPanel } from './ResultPanel.tsx'
import styles from './Calculator.module.css'

export function Calculator() {
  const { a, b, state, setA, setB, apply } = useCalculator()

  // One in-flight request at a time. A key that stays live while its own
  // answer is on the way is a double submit waiting to happen.
  const busy = state.status === 'loading'

  return (
    <div className={styles.calculator}>
      <ResultPanel state={state} />

      <div className={styles.operands}>
        <NumberField label="First number" value={a} disabled={busy} onChange={setA} />
        <NumberField label="Second number" value={b} disabled={busy} onChange={setB} />
      </div>

      <OperationKeypad disabled={busy} onSelect={apply} />
    </div>
  )
}
