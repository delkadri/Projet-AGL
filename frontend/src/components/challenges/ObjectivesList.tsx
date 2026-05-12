import { useState } from 'react'
import { mockChallenges } from '@/data/mockChallenges'
import { ChallengeCard } from './ChallengeCard'
import { ChallengeDetailsPopup } from './ChallengeDetailsPopup'

export function ObjectivesList() {
  const [challenges, setChallenges] = useState(mockChallenges)
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null)

  const selectedChallenge =
    challenges.find((challenge) => challenge.id === selectedChallengeId) ?? null
  const isLoading = false

  const leavesForNextLevel = 1000
  const completedChallengeLeaves = challenges
    .filter((c) => c.completed)
    .reduce((sum, c) => sum + c.leafReward, 0)
  const currentLeavesEarned = 320 + completedChallengeLeaves
  const userLevel = Math.floor(currentLeavesEarned / leavesForNextLevel) + 1
  const leavesProgress = (currentLeavesEarned % leavesForNextLevel / leavesForNextLevel) * 100

  // Calcul challenges de la semaine
  const getWeekStart = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }

  const currentWeekStart = getWeekStart(new Date())
  const currentWeekEnd = new Date(currentWeekStart)
  currentWeekEnd.setDate(currentWeekEnd.getDate() + 6)

  // challenges assignés à l'utilisateur pour la semaine en cours
  const assignedChallenges = challenges
  const weeklyTotalCount = assignedChallenges.length
  const weeklyCompletedCount = challenges.filter((c) => {
    if (!c.completedAt) return false
    const completedDate = new Date(c.completedAt)
    return completedDate >= currentWeekStart && completedDate <= currentWeekEnd
  }).length

  const weeklyProgress =
    weeklyTotalCount > 0 ? (weeklyCompletedCount / weeklyTotalCount) * 100 : 0

  // Trie challenges: active en premier, puis par date d'échéance
  const sortedChallenges = [...assignedChallenges].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1
    }
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  })

  const handleCompleteChallenge = async (challengeId: string) => {
    setChallenges((currentChallenges) =>
      currentChallenges.map((challenge) =>
        challenge.id === challengeId
          ? {
              ...challenge,
              completed: true,
              completedAt: new Date().toISOString(),
              progress: 100,
            }
          : challenge,
      ),
    )
  }

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1C5138] mb-1">Mes Objectifs</h1>
          <p className="text-sm text-gray-600">
            Complétez des défis pour gagner des feuilles et réduire votre empreinte carbone
          </p>
        </div>

        {/* Utilisateur et niveau progression */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 font-semibold mb-1">NIVEAU ACTUEL</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-[#1C5138]">{userLevel}</span>
                <span className="text-sm text-gray-500">Éco-Explorateur</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-600 font-semibold mb-1">FEUILLES ACCUMULÉES</p>
              <div className="flex items-center justify-end gap-1">
                <span className="text-xl">🍃</span>
                <span className="text-lg font-bold text-green-700">{currentLeavesEarned}</span>
                <span className="text-xs text-gray-500">/ {leavesForNextLevel}</span>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-600 font-semibold mb-1">Progression vers le niveau {userLevel + 1}</p>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-300 rounded-full"
                style={{ width: `${leavesProgress}%` }}
              />
            </div>
          </div>

          {/* barre de challenges de la semaine */}
          <div>
            <p className="text-xs text-gray-600 font-semibold mb-1">Défis de la semaine</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300 rounded-full"
                  style={{ width: `${weeklyProgress}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">
                {weeklyCompletedCount}/{weeklyTotalCount}
              </span>
            </div>
          </div>
        </div>

        {/* liste des challenges */}
        <div>
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-500">Chargement des objectifs...</p>
            </div>
          )}

          {!isLoading && sortedChallenges.length > 0 && (
            <div className="flex flex-col gap-3">
              {sortedChallenges.map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  onSelect={() => setSelectedChallengeId(challenge.id)}
                />
              ))}
            </div>
          )}

          {!isLoading && sortedChallenges.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <p className="text-4xl">🎯</p>
              <p className="text-gray-600 text-center">
                Aucun défi disponible pour le moment.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Challenge détails popup */}
      <ChallengeDetailsPopup
        challenge={selectedChallenge}
        onClose={() => setSelectedChallengeId(null)}
        onComplete={handleCompleteChallenge}
      />
    </div>
  )
}
