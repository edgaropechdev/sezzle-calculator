/**
 * Sezzle — design tokens.
 * Extraído de SezzleCo-BrandingGuide_08.2025.pdf (pp. 10, 27, 28), 22-sep-2026.
 * Gemelo de `tokens.css`: si tocas uno, toca el otro.
 */

export const sezzle = {
  bg: {
    mint:  '#E7FCF6',
    cream: '#FEF5ED',
    blush: '#FEEDEC',
  },
  soft: {
    green:  '#9FF4D9',
    orange: '#FCD7B6',
    salmon: '#F9B5B2',
    purple: '#D39BD3',
  },
  medium: {
    green:  '#29D3A2',
    orange: '#FEA500',
    salmon: '#F98575',
    purple: '#CE5DCB',
  },
  accent: {
    green:  '#00B874',
    orange: '#FF8100',
    salmon: '#FF5667',
    purple: '#8333D4',
    ink:    '#382757',
  },
} as const

/** Gradientes: accent → soft, vertical. Medidos del PDF, no publicados. */
export const sezzleGradients = {
  green:    'linear-gradient(180deg, #00B874 0%, #9FF4D9 100%)',
  orange:   'linear-gradient(180deg, #FF8100 0%, #FCD7B6 100%)',
  salmon:   'linear-gradient(180deg, #FF5667 0%, #F9B5B2 100%)',
  purple:   'linear-gradient(180deg, #8333D4 0%, #D39BD3 100%)',
  ink:      'linear-gradient(180deg, #382757 0%, #8333D4 100%)',
  spectrum: 'linear-gradient(90deg, #29D3A2 0%, #FEA500 38%, #FF5667 63%, #8333D4 100%)',
} as const

/**
 * Roles semánticos. Derivados, no publicados por Sezzle.
 * Sólo `ink` (13.16:1) y `accent.purple` (6.20:1) pasan WCAG AA como texto
 * sobre blanco. Todo lo demás es superficie, no texto.
 */
export const sezzleRoles = {
  text:       sezzle.accent.ink,
  textOnDark: '#FFFFFF',
  link:       sezzle.accent.purple,
  surface:    '#FFFFFF',
  sunken:     sezzle.bg.cream,
  focusRing:  sezzle.accent.purple,
  danger:     sezzle.accent.salmon,   // fondo/borde, no texto sobre blanco
  success:    sezzle.accent.green,    // idem
} as const

export type SezzleTier = keyof typeof sezzle
export type SezzleHex = (typeof sezzle)[SezzleTier][keyof (typeof sezzle)[SezzleTier]]
