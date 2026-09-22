// The whole screen. It owns the page frame — heading, centring, the note
// under the calculator — and delegates every interactive part to a component.

import { Calculator } from '../components/Calculator.tsx'
import { SezzleLogo } from '../components/SezzleLogo.tsx'
import styles from './CalculatorPage.module.css'

export function CalculatorPage() {
  return (
    <main className={styles.page}>
      <div className={styles.column}>
        <header className={styles.header}>
          <SezzleLogo />
          <h1 className={styles.title}>Calculator</h1>
          <p className={styles.subtitle}>
            Enter two numbers and pick an operation. Square root reads the first number
            only, so the second box can stay empty for it.
          </p>
        </header>

        <Calculator />

        <p className={styles.note}>
          Every rule about what counts as a valid number is the server&rsquo;s. This page sends what
          you typed and shows what came back.
        </p>
      </div>
    </main>
  )
}
