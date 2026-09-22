// One operation key. It is a plain button, not a submit: the operation is the
// action, so there is no separate "calculate" step to press afterwards.

import type { Operation } from '../api/calculate.ts'
import styles from './OperationButton.module.css'

interface OperationButtonProps {
  operation: Operation
  label: string
  symbol: string
  disabled: boolean
  onSelect: (operation: Operation) => void
}

export function OperationButton({ operation, label, symbol, disabled, onSelect }: OperationButtonProps) {
  return (
    <button
      type="button"
      className={styles.button}
      disabled={disabled}
      onClick={() => onSelect(operation)}
    >
      {/* The glyph is decorative; the written label is the accessible name. */}
      <span className={styles.symbol} aria-hidden="true">
        {symbol}
      </span>
      <span className={styles.label}>{label}</span>
    </button>
  )
}
