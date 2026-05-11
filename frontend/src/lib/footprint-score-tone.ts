/**
 * Couleur du score selon la moyenne nationale et l’objectif 2030 (7,1 t CO₂e/an — ADEME).
 *
 * - Rouge : au-dessus de la moyenne nationale
 * - Orange : entre l’objectif 2030 et la moyenne nationale (strictement au-dessus de 7,1 t et au plus égal à la moyenne)
 * - Vert : en dessous (ou égal) de l’objectif 2030
 */

export type FootprintScoreTone = 'green' | 'orange' | 'red'

const DEFAULT_NATIONAL_T = 10
const DEFAULT_TARGET_2030_T = 7.1
const EPS = 0.05

export function getFootprintScoreTone(
  totalTonnes: number,
  nationalAverageTonnes: number,
  target2030Tonnes: number = DEFAULT_TARGET_2030_T,
): FootprintScoreTone {
  const nat =
    Number.isFinite(nationalAverageTonnes) && nationalAverageTonnes > 0
      ? nationalAverageTonnes
      : DEFAULT_NATIONAL_T
  if (totalTonnes > nat + EPS) return 'red'
  if (totalTonnes > target2030Tonnes + EPS) return 'orange'
  return 'green'
}

export function getFootprintScoreToneTextClass(tone: FootprintScoreTone): string {
  switch (tone) {
    case 'green':
      return 'text-emerald-700'
    case 'orange':
      return 'text-orange-600'
    case 'red':
      return 'text-red-600'
  }
}

/** Gradient pour barres / jauges (Tailwind `bg-linear-to-r`). */
export function getFootprintScoreToneGaugeGradient(tone: FootprintScoreTone): string {
  switch (tone) {
    case 'green':
      return 'from-emerald-600 via-emerald-500 to-teal-400'
    case 'orange':
      return 'from-orange-600 via-amber-500 to-amber-400'
    case 'red':
      return 'from-red-700 via-red-600 to-rose-500'
  }
}

export function getFootprintScoreToneBadgeClass(tone: FootprintScoreTone): string {
  switch (tone) {
    case 'green':
      return 'bg-emerald-500/15 text-emerald-900 ring-emerald-600/25'
    case 'orange':
      return 'bg-orange-500/15 text-orange-950 ring-orange-600/25'
    case 'red':
      return 'bg-red-500/12 text-red-950 ring-red-500/30'
  }
}

/** Halo décoratif (`bg-linear-to-br`). */
export function getFootprintScoreToneAccentBlur(tone: FootprintScoreTone): string {
  switch (tone) {
    case 'green':
      return 'from-emerald-400 via-green-500 to-[#1A4D3E]'
    case 'orange':
      return 'from-amber-400 via-orange-500 to-orange-700'
    case 'red':
      return 'from-rose-400 via-red-500 to-red-800'
  }
}

/** Curseur / marqueur « vous » sur la jauge. */
export function getFootprintScoreToneMarkerClass(tone: FootprintScoreTone): string {
  switch (tone) {
    case 'green':
      return 'bg-emerald-600'
    case 'orange':
      return 'bg-orange-500'
    case 'red':
      return 'bg-red-600'
  }
}
