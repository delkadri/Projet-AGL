/** Identifiant legacy du mock « quiz du mois » (hors flux API `quiz-1`). */
export const QUIZ_DU_MOIS_QUIZ_ID = 'carbon-quiz-1'

export type QuizDuMoisEtat = 'a_faire' | 'bientot' | 'deja_fait'

const DEV_STORAGE_ETAT = '__dev_quiz_du_mois_etat'
const STORAGE_DONE_PERIOD = 'quiz_du_mois_done_period'

/** Premier jour du mois (1–31) où le quiz est considéré ouvert — avant = état « Bientôt » (mock). */
const QUIZ_OUVERT_A_PARTIR_DU_JOUR = 8

export function quizDuMoisPeriodeCourante(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function getDevQuizDuMoisEtatOverride(): QuizDuMoisEtat | null {
  if (typeof window === 'undefined') return null
  const v = localStorage.getItem(DEV_STORAGE_ETAT)
  if (v === 'a_faire' || v === 'bientot' || v === 'deja_fait') return v
  return null
}

/** Cycle : auto → à faire → bientôt → déjà fait → auto (localStorage). */
export function cycleDevQuizDuMoisEtatOverride(): void {
  if (typeof window === 'undefined') return
  const cur = localStorage.getItem(DEV_STORAGE_ETAT)
  const seq: Array<QuizDuMoisEtat | 'auto'> = ['auto', 'a_faire', 'bientot', 'deja_fait']
  let i = seq.findIndex((s) =>
    s === 'auto' ? cur === null || cur === undefined || cur === '' : cur === s,
  )
  if (i < 0) i = 0
  const next = seq[(i + 1) % seq.length]!
  if (next === 'auto') localStorage.removeItem(DEV_STORAGE_ETAT)
  else localStorage.setItem(DEV_STORAGE_ETAT, next)
}

export function labelDevQuizDuMoisOverrideCourant(): string {
  const o = getDevQuizDuMoisEtatOverride()
  if (o === null) return 'Auto (règles mock)'
  if (o === 'a_faire') return 'Forcer : à faire'
  if (o === 'bientot') return 'Forcer : bientôt'
  return 'Forcer : déjà fait'
}

/** Après soumission réussie du quiz carbone mensuel. */
export function enregistrerQuizDuMoisCommeFait(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_DONE_PERIOD, quizDuMoisPeriodeCourante())
  } catch {
    // ignore
  }
}

export function joursJusquOuvertureQuizMock(date = new Date()): number {
  const jour = date.getDate()
  if (jour >= QUIZ_OUVERT_A_PARTIR_DU_JOUR) return 0
  return QUIZ_OUVERT_A_PARTIR_DU_JOUR - jour
}

/** Heure fictive d’ouverture du quiz (mock, même règle que l’UI). */
const HEURE_OUVERTURE_MOCK = { h: 9, min: 0 } as const

/** Date d’ouverture de la fenêtre « ce mois » (jour 8 à 9 h 00 locale). */
export function dateOuvertureFenetreCouranteMock(date = new Date()): Date {
  const y = date.getFullYear()
  const m = date.getMonth()
  return new Date(y, m, QUIZ_OUVERT_A_PARTIR_DU_JOUR, HEURE_OUVERTURE_MOCK.h, HEURE_OUVERTURE_MOCK.min, 0, 0)
}

/**
 * Après un quiz enregistré pour la période en cours : prochaine ouverture = jour 8 du mois suivant à 9 h 00 (mock).
 */
export function dateProchainQuizOuvertureMock(date = new Date()): Date {
  const y = date.getFullYear()
  const m = date.getMonth()
  return new Date(y, m + 1, QUIZ_OUVERT_A_PARTIR_DU_JOUR, HEURE_OUVERTURE_MOCK.h, HEURE_OUVERTURE_MOCK.min, 0, 0)
}

export function formatDateProchainQuizFrMock(date = new Date()): string {
  const d = dateProchainQuizOuvertureMock(date)
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d)
}

/**
 * Libellé « temps restant » avant ouverture (mock : délai en jours + « 12 h » factices).
 */
export function libelleTempsRestantAvantOuvertureMock(date = new Date()): string {
  const j = joursJusquOuvertureQuizMock(date)
  const open = dateOuvertureFenetreCouranteMock(date)
  const dateCourte = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(open)
  const heure = `${HEURE_OUVERTURE_MOCK.h} h ${String(HEURE_OUVERTURE_MOCK.min).padStart(2, '0')}`

  if (j <= 0) {
    return `Ouverture le ${dateCourte} à ${heure}.`
  }
  if (j === 1) {
    return `Encore environ 1 jour et 12 h (mock) — ouverture demain à ${heure}.`
  }
  return `Encore environ ${j} jours et 12 h (mock) — ouverture le ${dateCourte} à ${heure}.`
}

/**
 * Résout l’état affiché : override dev si présent, sinon « déjà fait » pour la période,
 * sinon « bientôt » avant le jour d’ouverture mock, sinon « à faire ».
 */
export function getQuizDuMoisEtatResolu(date = new Date()): QuizDuMoisEtat {
  const dev = getDevQuizDuMoisEtatOverride()
  if (dev !== null) return dev

  if (typeof window === 'undefined') return 'a_faire'

  try {
    if (localStorage.getItem(STORAGE_DONE_PERIOD) === quizDuMoisPeriodeCourante()) {
      return 'deja_fait'
    }
  } catch {
    // ignore
  }

  if (joursJusquOuvertureQuizMock(date) > 0) return 'bientot'
  return 'a_faire'
}
