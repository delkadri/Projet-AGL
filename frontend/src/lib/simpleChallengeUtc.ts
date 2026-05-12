/** Même règle que le backend : une complétion par jour calendaire UTC. */
export function isSimpleChallengeCompletedTodayUtc(
  iso: string | null | undefined,
): boolean {
  if (!iso) return false
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return false
  const now = new Date()
  return (
    d.getUTCFullYear() === now.getUTCFullYear() &&
    d.getUTCMonth() === now.getUTCMonth() &&
    d.getUTCDate() === now.getUTCDate()
  )
}
