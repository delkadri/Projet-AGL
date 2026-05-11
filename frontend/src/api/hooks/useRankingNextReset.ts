import { useQuery } from '@tanstack/react-query'

const RANKING_NEXT_RESET_QUERY_KEY = ['communities', 'ranking', 'next-reset'] as const

/** Simule GET /communities/ranking/next-reset jusqu'à l'endpoint réel. */
export function useRankingNextReset() {
  return useQuery<{ nextReset: string }>({
    queryKey: RANKING_NEXT_RESET_QUERY_KEY,
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 300))
      const now = new Date()
      const year = now.getFullYear()
      const quarters = [
        new Date(`${year}-01-01T00:00:00.000Z`),
        new Date(`${year}-04-01T00:00:00.000Z`),
        new Date(`${year}-07-01T00:00:00.000Z`),
        new Date(`${year}-10-01T00:00:00.000Z`),
        new Date(`${year + 1}-01-01T00:00:00.000Z`),
      ]
      const next = quarters.find((d) => d > now) ?? quarters[quarters.length - 1]
      return { nextReset: next.toISOString() }
    },
    staleTime: 1000 * 60 * 60,
  })
}

export function formatTimeUntilReset(nextReset: string): string {
  const diff = new Date(nextReset).getTime() - Date.now()
  if (diff <= 0) return 'Réinitialisation imminente'
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  if (days === 1) return 'Réinitialisation dans 1 jour'
  return `Réinitialisation dans ${days} jours`
}
