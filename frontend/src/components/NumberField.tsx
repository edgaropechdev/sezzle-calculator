// One labelled operand box.
//
// The input is type="text" with inputMode="decimal" on purpose. type="number"
// would have the browser silently reject letters and hand back an empty
// string, which is the browser validating input this project validates on the
// server. Here everything typed is kept and sent; inputMode only asks a phone
// for the numeric keypad.

import { useId } from 'react'
import styles from './NumberField.module.css'

interface NumberFieldProps {
  label: string
  value: string
  disabled: boolean
  onChange: (value: string) => void
}

export function NumberField({ label, value, disabled, onChange }: NumberFieldProps) {
  const id = useId()

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className={styles.input}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}
