// The grid of operation keys. It reads the catalogue, so adding an operation
// is one entry in operations.ts and nothing here.

import type { Operation } from '../api/calculate.ts'
import { OPERATION_DESCRIPTORS } from './operations.ts'
import { OperationButton } from './OperationButton.tsx'
import styles from './OperationKeypad.module.css'

interface OperationKeypadProps {
  disabled: boolean
  onSelect: (operation: Operation) => void
}

export function OperationKeypad({ disabled, onSelect }: OperationKeypadProps) {
  return (
    <div className={styles.keypad} role="group" aria-label="Operations">
      {OPERATION_DESCRIPTORS.map((descriptor) => (
        <OperationButton
          key={descriptor.operation}
          operation={descriptor.operation}
          label={descriptor.label}
          symbol={descriptor.symbol}
          disabled={disabled}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}
