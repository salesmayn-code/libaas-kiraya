"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { sdk } from "@/lib/sdk"

const inputClass =
  "mt-1 w-full rounded-control border border-lakeer bg-surface px-3 py-2 text-sm text-syahi outline-none focus:border-shahtoot"

export function LoginForm({ next }: { next: string }) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setPending(true)

    try {
      const result = await sdk.auth.login("customer", "emailpass", { email, password })

      if (typeof result !== "string") {
        setError("This account needs an extra verification step, which is not enabled yet.")
        return
      }

      router.push(next)
      router.refresh()
    } catch {
      setError("That email and password did not match. Try again.")
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block text-sm font-medium text-syahi">
        Email
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={inputClass}
        />
      </label>
      <label className="block text-sm font-medium text-syahi">
        Password
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={inputClass}
        />
      </label>
      {error ? <p className="text-sm text-khatra">{error}</p> : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  )
}

export function RegisterForm() {
  const router = useRouter()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setPending(true)

    try {
      await sdk.auth.register("customer", "emailpass", { email, password })
      await sdk.store.customer.create({ email, first_name: firstName, last_name: lastName })
      await sdk.auth.login("customer", "emailpass", { email, password })
      router.push("/account/bookings")
      router.refresh()
    } catch {
      setError("Could not create the account. The email may already be registered.")
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm font-medium text-syahi">
          First name
          <input
            required
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block text-sm font-medium text-syahi">
          Last name
          <input
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            className={inputClass}
          />
        </label>
      </div>
      <label className="block text-sm font-medium text-syahi">
        Email
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={inputClass}
        />
      </label>
      <label className="block text-sm font-medium text-syahi">
        Password
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={inputClass}
        />
      </label>
      {error ? <p className="text-sm text-khatra">{error}</p> : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating…" : "Create account"}
      </Button>
    </form>
  )
}
