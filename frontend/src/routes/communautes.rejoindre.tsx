import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Loader2,
  Lock,
  Search,
  Sparkles,
  Users,
} from 'lucide-react'

import { useCommunitySearch } from '@/api/hooks/useCommunitySearch'
import {
  JOIN_ERROR_INVALID_CODE,
  useJoinCommunity,
} from '@/api/hooks/useJoinCommunity'
import { useUserCommunities } from '@/api/hooks/useUserCommunities'
import BottomNav from '@/components/home/BottomNav'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  getMockFeaturedCommunities,
  type CommunitySearchHitDto,
} from '@/data/mockCommunityDirectory'

export const Route = createFileRoute('/communautes/rejoindre')({
  component: RejoindreCommunautePage,
})

function RejoindreCommunautePage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [privateTarget, setPrivateTarget] = useState<CommunitySearchHitDto | null>(null)
  const [inviteCode, setInviteCode] = useState('')
  const [inviteError, setInviteError] = useState(false)

  const { data: memberships } = useUserCommunities()
  const memberIds = useMemo(() => {
    const s = new Set<string>()
    memberships?.forEach((m) => s.add(m.community.id))
    return s
  }, [memberships])

  const featured = useMemo(() => getMockFeaturedCommunities(memberIds), [memberIds])

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query), 360)
    return () => window.clearTimeout(t)
  }, [query])

  const {
    data: searchHits,
    isPending: searchPending,
    isFetching: searchFetching,
    isError: searchError,
  } = useCommunitySearch(debouncedQuery)

  const joinMutation = useJoinCommunity()
  const showSearchResults = debouncedQuery.trim().length >= 2
  const listLoading = showSearchResults && (searchPending || searchFetching)

  const goToCommunity = (id: string) => {
    navigate({ to: '/communautes/$communityId', params: { communityId: id } })
  }

  const handleOpenPrivateDialog = (c: CommunitySearchHitDto) => {
    setInviteError(false)
    setInviteCode('')
    setPrivateTarget(c)
  }

  const handleJoinPublic = async (c: CommunitySearchHitDto) => {
    if (c.already_member) {
      goToCommunity(c.id)
      return
    }
    setJoiningId(c.id)
    try {
      await joinMutation.mutateAsync({ communityId: c.id })
      goToCommunity(c.id)
    } finally {
      setJoiningId(null)
    }
  }

  const handleConfirmPrivateJoin = async () => {
    if (!privateTarget || privateTarget.already_member) return
    setInviteError(false)
    setJoiningId(privateTarget.id)
    try {
      await joinMutation.mutateAsync({
        communityId: privateTarget.id,
        inviteCode,
      })
      setPrivateTarget(null)
      setInviteCode('')
      goToCommunity(privateTarget.id)
    } catch (e) {
      if (e instanceof Error && e.message === JOIN_ERROR_INVALID_CODE) {
        setInviteError(true)
      }
    } finally {
      setJoiningId(null)
    }
  }

  return (
    <div className="min-h-[calc(100vh-70px)] w-full bg-[#f1f8e9] px-4 pb-24 pt-4">
      <div className="mx-auto max-w-md">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 mb-4 h-9 w-fit px-2 text-[#1b5e20]"
          asChild
        >
          <Link to="/communautes">
            <ArrowLeft className="size-4" />
            Retour aux communautés
          </Link>
        </Button>

        <header className="mb-5">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Rejoindre une communauté
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
            Recherchez un groupe par nom ou thème, puis rejoignez-le. Les communautés privées
            demandent un code d’invitation.
          </p>
        </header>

        <div className="relative mb-5">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-500"
            aria-hidden
          />
          <Input
            id="community-join-search"
            type="search"
            autoComplete="off"
            placeholder="Ex. vélo, zéro déchet, campus…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-11 rounded-xl border-[#1b5e20]/25 bg-white pr-3 pl-10 shadow-sm"
            aria-describedby="community-join-search-hint"
          />
        </div>
        <p id="community-join-search-hint" className="sr-only">
          Saisissez au moins deux caractères pour lancer la recherche dans l’annuaire.
        </p>

        {!showSearchResults && (
          <section aria-labelledby="featured-communities-heading" className="mb-6">
            <h2
              id="featured-communities-heading"
              className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800"
            >
              <Sparkles className="size-4 text-[#1b5e20]" aria-hidden />
              Idées pour commencer
            </h2>
            <p className="mb-3 text-xs text-gray-600">
              Communautés publiques que vous n’avez pas encore rejointes — ou lancez une recherche
              ci-dessus.
            </p>
            {featured.length === 0 ? (
              <p className="rounded-xl border border-[#1b5e20]/20 bg-white/80 px-4 py-3 text-sm text-gray-700">
                Vous explorez déjà toutes les suggestions publiques. Utilisez la recherche pour en
                trouver d’autres.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {featured.map((c) => (
                  <li key={c.id}>
                    <FeaturedCommunityRow
                      community={c}
                      onJoin={() => handleJoinPublic(c)}
                      joining={joiningId === c.id}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {showSearchResults && (
          <section aria-labelledby="search-results-heading">
            <h2 id="search-results-heading" className="sr-only">
              Résultats de recherche
            </h2>
            {searchError && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                La recherche n’a pas pu aboutir. Réessayez dans un instant.
              </p>
            )}
            {!searchError && listLoading && <SearchResultsSkeleton />}
            {!searchError && !listLoading && searchHits && searchHits.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[#1b5e20]/30 bg-white/80 px-4 py-8 text-center">
                <Search className="mx-auto mb-2 size-9 text-[#1b5e20]/50" aria-hidden />
                <p className="text-sm font-medium text-gray-800">Aucun résultat</p>
                <p className="mt-1 text-xs text-gray-600">
                  Essayez un autre mot-clé ou vérifiez l’orthographe.
                </p>
              </div>
            )}
            {!searchError && !listLoading && searchHits && searchHits.length > 0 && (
              <ul className="flex flex-col gap-3">
                {searchHits.map((c) => (
                  <li key={c.id}>
                    <SearchResultCard
                      community={c}
                      joiningId={joiningId}
                      onJoinPublic={() => handleJoinPublic(c)}
                      onOpenPrivate={() => handleOpenPrivateDialog(c)}
                      onOpenMember={() => goToCommunity(c.id)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <p className="mt-6 text-center text-[11px] leading-snug text-gray-500">
          Données de démonstration — les appels réseau seront branchés sur l’API plus tard.
        </p>
      </div>

      <Dialog
        open={privateTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPrivateTarget(null)
            setInviteCode('')
            setInviteError(false)
          }
        }}
      >
        <DialogContent className="border-[#1b5e20]/20 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 pr-8">
              <Lock className="size-5 shrink-0 text-[#1b5e20]" aria-hidden />
              Communauté privée
            </DialogTitle>
            <DialogDescription asChild>
              <div>
                <p>
                  <span className="font-medium text-gray-800">{privateTarget?.name}</span> nécessite
                  un code d’invitation pour rejoindre le groupe.
                </p>
                <p className="mt-2 text-xs text-gray-600">
                  Démo : codes acceptés <code className="rounded bg-muted px-1">ECOBAT24</code> et{' '}
                  <code className="rounded bg-muted px-1">ALUMNI26</code>.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="invite-code">Code d’invitation</Label>
            <Input
              id="invite-code"
              autoComplete="one-time-code"
              placeholder="Saisissez le code"
              value={inviteCode}
              onChange={(e) => {
                setInviteCode(e.target.value)
                setInviteError(false)
              }}
              className="h-10 rounded-lg"
              aria-invalid={inviteError}
            />
            {inviteError && (
              <p className="text-sm text-red-700" role="alert">
                Code incorrect ou expiré. Vérifiez avec l’organisateur·rice du groupe.
              </p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="border-[#1b5e20]/35"
              onClick={() => setPrivateTarget(null)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              className="inline-flex items-center gap-2 bg-[#1b5e20] text-white hover:bg-[#2e7d32]"
              disabled={
                !inviteCode.trim() ||
                joiningId === privateTarget?.id ||
                (privateTarget?.already_member ?? false)
              }
              onClick={() => void handleConfirmPrivateJoin()}
            >
              {joiningId === privateTarget?.id ? (
                <>
                  <Loader2 className="size-4 animate-spin shrink-0" aria-hidden />
                  Connexion…
                </>
              ) : (
                'Rejoindre'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  )
}

function FeaturedCommunityRow({
  community,
  onJoin,
  joining,
}: {
  community: CommunitySearchHitDto
  onJoin: () => void
  joining: boolean
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#1b5e20]/15 bg-white p-3 shadow-sm">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900">{community.name}</p>
        <p className="mt-0.5 line-clamp-1 text-xs text-gray-600">{community.description}</p>
        <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
          <Users className="size-3.5 shrink-0" aria-hidden />
          {community.member_count} membre{community.member_count > 1 ? 's' : ''}
        </p>
      </div>
      <Button
        type="button"
        size="sm"
        className="shrink-0 bg-[#1b5e20] text-white hover:bg-[#2e7d32]"
        disabled={joining}
        onClick={() => void onJoin()}
      >
        {joining ? <Loader2 className="size-4 animate-spin" aria-hidden /> : 'Rejoindre'}
      </Button>
    </div>
  )
}

function SearchResultCard({
  community,
  joiningId,
  onJoinPublic,
  onOpenPrivate,
  onOpenMember,
}: {
  community: CommunitySearchHitDto
  joiningId: string | null
  onJoinPublic: () => void
  onOpenPrivate: () => void
  onOpenMember: () => void
}) {
  const joining = joiningId === community.id

  return (
    <div className="rounded-2xl bg-white p-4 shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-semibold text-gray-900">{community.name}</span>
            {community.visibility === 'private' && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-700/40 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-950">
                <Lock className="size-3" aria-hidden />
                Privée
              </span>
            )}
            {community.already_member && (
              <span className="rounded-full bg-[#e8f5e9] px-2 py-0.5 text-xs font-semibold text-[#1b5e20]">
                Membre
              </span>
            )}
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-gray-600">{community.description}</p>
          <p className="mt-2 flex items-center gap-1 text-xs text-gray-500">
            <Users className="size-3.5 shrink-0" aria-hidden />
            {community.member_count} membre{community.member_count > 1 ? 's' : ''}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {community.already_member ? (
          <Button
            type="button"
            size="sm"
            className="bg-[#1b5e20] text-white hover:bg-[#2e7d32]"
            onClick={onOpenMember}
          >
            Ouvrir la communauté
          </Button>
        ) : community.visibility === 'private' ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-[#1b5e20]/45 text-[#1b5e20] hover:bg-[#e8f5e9]"
            disabled={joining}
            onClick={onOpenPrivate}
          >
            Rejoindre avec un code
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            className="inline-flex items-center gap-2 bg-[#1b5e20] text-white hover:bg-[#2e7d32]"
            disabled={joining}
            onClick={() => void onJoinPublic()}
          >
            {joining ? (
              <>
                <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                Connexion…
              </>
            ) : (
              'Rejoindre'
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

function SearchResultsSkeleton() {
  return (
    <ul className="flex flex-col gap-3" aria-hidden>
      {[1, 2, 3].map((i) => (
        <li key={i} className="h-36 animate-pulse rounded-2xl bg-white/90 shadow-md" />
      ))}
    </ul>
  )
}
