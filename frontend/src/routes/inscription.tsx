import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { useState } from 'react'

import { useRegisterMutation, getAuthErrorMessage } from '@/api/hooks/useAuth'
import { AuthBranding } from '@/components/AuthBranding'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const Route = createFileRoute('/inscription')({
  component: InscriptionPage,
})

function InscriptionPage() {
  const navigate = useNavigate()
  const registerMutation = useRegisterMutation()
  const [formError, setFormError] = useState<string | null>(null)
  const apiErrorMessage =
    registerMutation.error != null ? getAuthErrorMessage(registerMutation.error) : null
  const errorMessage = formError ?? apiErrorMessage

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
    onSubmit: async ({ value }) => {
      setFormError(null)

      if (value.password !== value.confirmPassword) {
        setFormError('Les mots de passe ne correspondent pas.')
        return
      }
      if (value.password.length < 8) {
        setFormError('Le mot de passe doit contenir au moins 8 caractères.')
        return
      }

      try {
        await registerMutation.mutateAsync({
          email: value.email,
          password: value.password,
        })
        navigate({ to: '/' })
      } catch {
        // l'erreur est gérée par TanStack Query via registerMutation.error
      }
    },
  })

  return (
    <div className="flex h-screen flex-col items-center justify-center overflow-hidden bg-[#f0f7f0] px-4">
      <div className="w-full max-w-[340px]">
        <AuthBranding />

        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            void form.handleSubmit()
          }}
          className="mt-6 flex flex-col gap-3"
        >
          <form.Field
            name="email"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="Email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    field.handleChange(e.target.value)
                  }
                  required
                  className="rounded-xl border-gray-200 bg-white"
                  autoComplete="email"
                />
              </div>
            )}
          />
          <form.Field
            name="password"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor="signup-password">Mot de passe</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="Mot de passe"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    field.handleChange(e.target.value)
                  }
                  required
                  className="rounded-xl border-gray-200 bg-white"
                  autoComplete="new-password"
                />
              </div>
            )}
          />
          <form.Field
            name="confirmPassword"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor="signup-confirm-password">Confirmer le mot de passe</Label>
                <Input
                  id="signup-confirm-password"
                  type="password"
                  placeholder="Confirmer le mot de passe"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    field.handleChange(e.target.value)
                  }
                  required
                  className="rounded-xl border-gray-200 bg-white"
                  autoComplete="new-password"
                />
              </div>
            )}
          />
          <Button
            type="submit"
            className="mt-2 h-12 rounded-xl bg-[#1A4D3E] text-white hover:bg-[#153d30]"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? "Création du compte..." : "S'inscrire"}
          </Button>
          {errorMessage && typeof errorMessage === 'string' && (
            <p className="mt-2 text-sm text-red-600">
              {errorMessage}
            </p>
          )}
        </form>

        {/* OAuth providers (Google, Apple, LinkedIn) — désactivé pour l’instant (TER-10)
        <p className="mt-4 text-center text-sm text-[#4a5568]">Ou s'inscrire avec</p>
        <div className="mt-2 flex justify-center gap-5">
          <button
            type="button"
            className="rounded-full p-2 transition hover:bg-white/80"
            aria-label="S'inscrire avec Google"
            onClick={() => {
              // TODO: OAuth Google (TER-10)
            }}
          >
            <img src="/socials/google.png" alt="" className="size-8 object-contain" />
          </button>
          <button
            type="button"
            className="rounded-full p-2 transition hover:bg-white/80"
            aria-label="S'inscrire avec Apple"
            onClick={() => {
              // TODO: OAuth Apple (TER-10)
            }}
          >
            <img src="/socials/apple.png" alt="" className="size-8 object-contain" />
          </button>
          <button
            type="button"
            className="rounded-full p-2 transition hover:bg-white/80"
            aria-label="S'inscrire avec LinkedIn"
            onClick={() => {
              // TODO: OAuth LinkedIn (TER-10)
            }}
          >
            <img src="/socials/linkedin.png" alt="" className="size-8 object-contain" />
          </button>
        </div>
        */}

        <p className="mt-5 text-center text-sm text-[#4a5568]">
          Déjà un compte ?{' '}
          <Link to="/login" className="font-medium text-[#1A4D3E] underline hover:no-underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}
