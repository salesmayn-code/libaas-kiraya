"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Container } from "@/components/ui/container"
import { Button } from "@/components/ui/button"
import { sdk } from "@/lib/sdk"
import type { MeasurementProfile } from "@/lib/fit"

const inputClass =
  "mt-1 w-full rounded-control border border-lakeer bg-surface px-3 py-2 text-sm text-syahi outline-none focus:border-shahtoot"

type FormState = {
  label: string
  unit: "in" | "cm"
  bust_chest: string
  waist: string
  hips: string
  shoulder: string
  height: string
  is_default: boolean
}

const EMPTY: FormState = {
  label: "Me",
  unit: "in",
  bust_chest: "",
  waist: "",
  hips: "",
  shoulder: "",
  height: "",
  is_default: true,
}

export default function MeasurementsPage() {
  const [profiles, setProfiles] = useState<MeasurementProfile[]>([])
  const [form, setForm] = useState<FormState>(EMPTY)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function load() {
    try {
      const result = await sdk.client.fetch<{ profiles: MeasurementProfile[] }>("/store/me/measurements")
      setProfiles(result.profiles)
      const defaultProfile = result.profiles.find((profile) => profile.is_default)
      if (defaultProfile) {
        setForm({
          label: defaultProfile.label,
          unit: defaultProfile.unit,
          bust_chest: defaultProfile.bust_chest?.toString() ?? "",
          waist: defaultProfile.waist?.toString() ?? "",
          hips: defaultProfile.hips?.toString() ?? "",
          shoulder: defaultProfile.shoulder?.toString() ?? "",
          height: defaultProfile.height?.toString() ?? "",
          is_default: true,
        })
      }
    } catch {
      setError("Sign in to save measurements.")
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(null)

    try {
      const defaultProfile = profiles.find((profile) => profile.is_default)
      const body = {
        label: form.label,
        garment_type: "women" as const,
        unit: form.unit,
        bust_chest: form.bust_chest ? Number(form.bust_chest) : undefined,
        waist: form.waist ? Number(form.waist) : undefined,
        hips: form.hips ? Number(form.hips) : undefined,
        shoulder: form.shoulder ? Number(form.shoulder) : undefined,
        height: form.height ? Number(form.height) : undefined,
        is_default: form.is_default,
      }

      if (defaultProfile) {
        await sdk.client.fetch(`/store/me/measurements/${defaultProfile.id}`, {
          method: "POST",
          body,
        })
      } else {
        await sdk.client.fetch("/store/me/measurements", { method: "POST", body })
      }

      await load()
    } catch {
      setError("Could not save your measurements.")
    } finally {
      setPending(false)
    }
  }

  return (
    <main>
      <Container className="py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-4xl text-shahtoot">Measurements</h1>
            <p className="mt-2 text-sm text-dhundla">
              Save once. Listing pages can compare your profile with each size.
            </p>
          </div>
          <Link href="/account/bookings" className="text-sm text-dhundla underline">
            My bookings
          </Link>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1fr]">
          <form onSubmit={onSubmit} className="space-y-4 rounded-control border border-lakeer bg-surface p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium text-syahi">
                Profile name
                <input required value={form.label} onChange={(e) => set("label", e.target.value)} className={inputClass} />
              </label>
              <label className="block text-sm font-medium text-syahi">
                Unit
                <select value={form.unit} onChange={(e) => set("unit", e.target.value as "in" | "cm")} className={inputClass}>
                  <option value="in">inches</option>
                  <option value="cm">centimetres</option>
                </select>
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["bust_chest", "Bust / chest"],
                  ["waist", "Waist"],
                  ["hips", "Hips"],
                  ["shoulder", "Shoulder"],
                  ["height", "Height"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="block text-sm font-medium text-syahi">
                  {label}
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={form[key]}
                    onChange={(e) => set(key, e.target.value)}
                    className={inputClass}
                  />
                </label>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm text-syahi">
              <input
                type="checkbox"
                checked={form.is_default}
                onChange={(e) => set("is_default", e.target.checked)}
              />
              Use as my default profile
            </label>
            {error ? <p className="text-sm text-khatra">{error}</p> : null}
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save profile"}
            </Button>
          </form>

          <div>
            <h2 className="text-sm font-semibold text-syahi">Saved profiles</h2>
            <ul className="mt-3 space-y-3">
              {profiles.map((profile) => (
                <li key={profile.id} className="rounded-control border border-lakeer bg-surface p-4">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-medium text-syahi">
                        {profile.label} {profile.is_default ? "(default)" : ""}
                      </p>
                      <p className="mt-1 text-xs text-dhundla">
                        {profile.bust_chest ? `bust ${profile.bust_chest}${profile.unit}` : ""}{" "}
                        {profile.waist ? `waist ${profile.waist}${profile.unit}` : ""}{" "}
                        {profile.hips ? `hips ${profile.hips}${profile.unit}` : ""}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
              {!profiles.length ? (
                <li className="rounded-control border border-dashed border-lakeer bg-surface p-6 text-sm text-dhundla">
                  No profiles saved yet.
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      </Container>
    </main>
  )
}
