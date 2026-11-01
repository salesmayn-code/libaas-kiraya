"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { sdk } from "@/lib/sdk"

const inputClass =
  "mt-1 w-full rounded-control border border-lakeer bg-surface px-3 py-2 text-sm text-syahi outline-none focus:border-shahtoot"

export function VendorLoginForm() {
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
      const result = await sdk.auth.login("vendor", "emailpass", { email, password })

      if (typeof result !== "string") {
        setError("Additional verification is required for this account.")
        return
      }

      router.push("/vendor/today")
      router.refresh()
    } catch {
      setError("That email and password did not match a vendor account.")
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block text-sm font-medium text-syahi">
        Vendor email
        <input
          type="email"
          required
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
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={inputClass}
        />
      </label>
      {error ? <p className="text-sm text-khatra">{error}</p> : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Signing in…" : "Sign in to vendor portal"}
      </Button>
    </form>
  )
}

export function VendorRegisterForm() {
  const router = useRouter()
  const [form, setForm] = useState({
    owner_name: "",
    email: "",
    password: "",
    name: "",
    handle: "",
    phone: "",
    city: "Islamabad",
    description: "",
    instagram_handle: "",
  })
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setPending(true)

    try {
      await sdk.auth.register("vendor", "emailpass", {
        email: form.email,
        password: form.password,
      })

      await sdk.client.fetch("/vendor/register", {
        method: "POST",
        body: {
          name: form.name,
          handle: form.handle || undefined,
          email: form.email,
          phone: form.phone,
          city: form.city,
          description: form.description || undefined,
          instagram_handle: form.instagram_handle || undefined,
          owner: {
            name: form.owner_name,
            email: form.email,
          },
        },
      })

      await sdk.auth.login("vendor", "emailpass", {
        email: form.email,
        password: form.password,
      })

      router.push("/vendor/today")
      router.refresh()
    } catch {
      setError("Registration failed. The handle or email may already be in use.")
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium text-syahi">
          Your name
          <input required value={form.owner_name} onChange={(e) => set("owner_name", e.target.value)} className={inputClass} />
        </label>
        <label className="block text-sm font-medium text-syahi">
          Email
          <input type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} className={inputClass} />
        </label>
      </div>
      <label className="block text-sm font-medium text-syahi">
        Password
        <input type="password" required minLength={8} value={form.password} onChange={(e) => set("password", e.target.value)} className={inputClass} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium text-syahi">
          Boutique name
          <input required value={form.name} onChange={(e) => set("name", e.target.value)} className={inputClass} />
        </label>
        <label className="block text-sm font-medium text-syahi">
          Handle (optional)
          <input value={form.handle} onChange={(e) => set("handle", e.target.value)} className={inputClass} placeholder="saima-couture" />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium text-syahi">
          Phone
          <input required value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputClass} />
        </label>
        <label className="block text-sm font-medium text-syahi">
          City
          <select value={form.city} onChange={(e) => set("city", e.target.value)} className={inputClass}>
            <option>Rawalpindi</option>
            <option>Islamabad</option>
            <option>Lahore</option>
          </select>
        </label>
      </div>
      <label className="block text-sm font-medium text-syahi">
        About the boutique
        <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} className={inputClass} />
      </label>
      {error ? <p className="text-sm text-khatra">{error}</p> : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Registering…" : "Register boutique"}
      </Button>
      <p className="text-xs text-dhundla">
        Your listings stay private until an admin approves the boutique.
      </p>
    </form>
  )
}
