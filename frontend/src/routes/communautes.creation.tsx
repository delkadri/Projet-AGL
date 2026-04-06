import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Check } from 'lucide-react'
import { type FormEvent, useEffect, useId, useRef, useState } from 'react'
import { toast } from 'sonner'

import { useCreateCommunity } from '@/api/hooks/useCreateCommunity'
import { useAuth } from '@/auth/AuthContext'
import BottomNav from '@/components/home/BottomNav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const Route = createFileRoute('/communautes/creation')({
  component: CreationGroupePage,
})

const fieldClass =
  'rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-base text-gray-900 shadow-none placeholder:text-gray-400 focus-visible:border-[#1b5e20]/50 focus-visible:ring-[#1b5e20]/25 md:text-sm'

const MIN_LEVEL_CREATE_COMMUNITY = 3

function CreationGroupePage() {
  const navigate = useNavigate()
  const { user, isAuthLoading } = useAuth()
  const notifiedRedirectRef = useRef(false)
  const { mutate, isPending, isError, error, reset } = useCreateCommunity()

  useEffect(() => {
    if (isAuthLoading || !user) return
    if (user.niveau >= MIN_LEVEL_CREATE_COMMUNITY) return
    if (!notifiedRedirectRef.current) {
      notifiedRedirectRef.current = true
      toast.error('Vous devez être niveau 3 pour créer une communauté.', {
        id: 'communaute-creation-niveau',
      })
      void navigate({ to: '/communautes', replace: true })
    }
  }, [isAuthLoading, user, navigate])

  const nameId = useId()
  const descId = useId()
  const passwordId = useId()
  const privateId = useId()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [password, setPassword] = useState('')
  const [touchedSubmit, setTouchedSubmit] = useState(false)

  const passwordRequired = isPrivate
  const passwordInvalid =
    passwordRequired && touchedSubmit && password.trim().length < 4
  const nameInvalid = touchedSubmit && name.trim().length < 2

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setTouchedSubmit(true)
    reset()

    if (!user || user.niveau < MIN_LEVEL_CREATE_COMMUNITY) return

    if (name.trim().length < 2) return
    if (isPrivate && password.trim().length < 4) return

    mutate(
      {
        name: name.trim(),
        description: description.trim(),
        is_private: isPrivate,
        ...(isPrivate ? { join_password: password } : {}),
      },
      {
        onSuccess: (membership) => {
          void navigate({
            to: '/communautes/$communityId',
            params: { communityId: membership.community.id },
          })
        },
      },
    )
  }

  if (isAuthLoading || !user || user.niveau < MIN_LEVEL_CREATE_COMMUNITY) {
    return (
      <div className="min-h-[calc(100vh-70px)] w-full bg-[#f1f8e9] pb-40 pt-4">
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-70px)] w-full bg-[#f1f8e9] pb-40 pt-4">
      <form onSubmit={handleSubmit} className="mx-auto max-w-md px-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-ml-2 mb-4 text-[#1b5e20]"
          asChild
        >
          <Link to="/communautes">
            <ArrowLeft className="size-4" />
            Retour
          </Link>
        </Button>

        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Création d’un groupe
        </h1>

        <div className="mt-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={nameId} className="text-sm font-medium text-gray-500">
              Nom du groupe
            </Label>
            <Input
              id={nameId}
              name="name"
              className={fieldClass}
              placeholder="Les vertes"
              value={name}
              onChange={(ev) => setName(ev.target.value)}
              aria-invalid={nameInvalid}
              autoComplete="off"
            />
            {nameInvalid && (
              <p className="text-xs text-red-600">Indiquez au moins 2 caractères.</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={descId} className="text-sm font-medium text-gray-500">
              Description du groupe
            </Label>
            <textarea
              id={descId}
              name="description"
              rows={4}
              className={fieldClass}
              placeholder="Amateur des gestes écologiques"
              value={description}
              onChange={(ev) => setDescription(ev.target.value)}
            />
          </div>

          <div className="rounded-xl border border-gray-200/80 bg-white/90 p-4">
            <div className="flex gap-3">
              <input
                type="checkbox"
                id={privateId}
                checked={isPrivate}
                onChange={(e) => {
                  const on = e.target.checked
                  setIsPrivate(on)
                  if (!on) setPassword('')
                }}
                className="peer sr-only"
              />
              <label
                htmlFor={privateId}
                className="mt-0.5 flex size-[22px] shrink-0 cursor-pointer items-center justify-center rounded border-2 border-gray-900 bg-white peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-gray-900 peer-focus-visible:ring-offset-2 peer-checked:bg-gray-900 peer-checked:text-white"
              >
                {isPrivate ? <Check className="size-3.5 stroke-3" aria-hidden /> : null}
              </label>
              <div className="min-w-0 flex-1">
                <label htmlFor={privateId} className="block cursor-pointer">
                  <span className="text-sm font-bold text-gray-900">Groupe privé</span>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500">
                    Si votre groupe est privé, un mot de passe sera demandé aux utilisateurs
                    souhaitant rejoindre votre groupe
                  </p>
                </label>
              </div>
            </div>
          </div>

          {isPrivate && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={passwordId} className="text-sm font-medium text-gray-500">
                Mot de passe
              </Label>
              <Input
                id={passwordId}
                name="password"
                type="password"
                className={fieldClass}
                placeholder="Mot de passe"
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
                aria-invalid={passwordInvalid}
                autoComplete="new-password"
              />
              {passwordInvalid && (
                <p className="text-xs text-red-600">
                  Choisissez un mot de passe d’au moins 4 caractères.
                </p>
              )}
            </div>
          )}
        </div>

        {isError && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error.message || 'Une erreur est survenue. Réessayez.'}
          </p>
        )}

        <div className="pointer-events-none fixed inset-x-0 bottom-19 z-30 px-4">
          <div className="pointer-events-auto mx-auto max-w-md">
            <Button
              type="submit"
              disabled={isPending}
              className="h-12 w-full rounded-2xl bg-[#006644] text-base font-semibold text-white shadow-md hover:bg-[#005538] disabled:opacity-70"
            >
              {isPending ? 'Création…' : 'Créer le groupe'}
            </Button>
          </div>
        </div>
      </form>
      <BottomNav />
    </div>
  )
}
