import { Link, createFileRoute } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'

import { AuthBranding } from '@/components/AuthBranding'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      // TODO: appeler l'API de connexion (TER-10)
      console.log(value)
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
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
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
                <Label htmlFor="login-password">Mot de passe</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="Mot de passe"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  required
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    field.handleChange(e.target.value)
                  }
                  className="rounded-xl border-gray-200 bg-white"
                  autoComplete="current-password"
                />
              </div>
            )}
          />
          <Button
            type="submit"
            className="mt-2 h-12 rounded-xl bg-[#1A4D3E] text-white hover:bg-[#153d30]"
          >
            Se connecter
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-[#4a5568]">Ou se connecter avec</p>
        <div className="mt-2 flex justify-center gap-5">
          <button
            type="button"
            className="rounded-full p-2 transition hover:bg-white/80"
            aria-label="Se connecter avec Google"
            onClick={() => {
              // TODO: OAuth Google (TER-10)
            }}
          >
            <img src="/socials/google.png" alt="" className="size-8 object-contain" />
          </button>
          <button
            type="button"
            className="rounded-full p-2 transition hover:bg-white/80"
            aria-label="Se connecter avec Apple"
            onClick={() => {
              // TODO: OAuth Apple (TER-10)
            }}
          >
            <img src="/socials/apple.png" alt="" className="size-8 object-contain" />
          </button>
          <button
            type="button"
            className="rounded-full p-2 transition hover:bg-white/80"
            aria-label="Se connecter avec LinkedIn"
            onClick={() => {
              // TODO: OAuth LinkedIn (TER-10)
            }}
          >
            <img src="/socials/linkedin.png" alt="" className="size-8 object-contain" />
          </button>
        </div>

        <p className="mt-5 text-center text-sm text-[#4a5568]">
          Pas encore de compte ?{' '}
          <Link to="/inscription" className="font-medium text-[#1A4D3E] underline hover:no-underline">
            S'inscrire
          </Link>
        </p>
      </div>
    </div>
  )
}
