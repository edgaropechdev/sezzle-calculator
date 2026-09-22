import wordmark from '../assets/logo/svg/sezzle-logo-color-dark-text.svg'
import styles from './SezzleLogo.module.css'

export function SezzleLogo() {
  // The dark-text lockup: the page sits on cream, and the white-text variant
  // is for dark surfaces only.
  return <img className={styles.logo} src={wordmark} alt="Sezzle" width={195} height={51} />
}
