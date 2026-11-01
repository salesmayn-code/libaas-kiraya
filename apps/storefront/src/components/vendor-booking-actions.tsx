"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { uploadVendorPhotos, type VendorBooking } from "@/lib/vendor"
import { sdk } from "@/lib/sdk"

export function VendorBookingActions({
  booking,
  onChanged,
}: {
  booking: VendorBooking
  onChanged: () => void
}) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showInspection, setShowInspection] = useState(false)
  const [outcome, setOutcome] = useState<"clean" | "minor_damage" | "major_damage" | "loss">("clean")
  const [damage, setDamage] = useState("0")
  const [notes, setNotes] = useState("")
  const [files, setFiles] = useState<FileList | null>(null)
  const [handoverFiles, setHandoverFiles] = useState<FileList | null>(null)

  async function run(action: "dispatch" | "return") {
    setPending(true)
    setError(null)

    try {
      const body =
        action === "dispatch" && handoverFiles?.length
          ? { photo_keys: await uploadVendorPhotos(handoverFiles, "private") }
          : undefined

      await sdk.client.fetch(`/vendor/bookings/${booking.id}/${action}`, {
        method: "POST",
        body,
      })
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed")
    } finally {
      setPending(false)
    }
  }

  async function submitInspection(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(null)

    try {
      const photoKeys = files?.length ? await uploadVendorPhotos(files, "private") : []

      await sdk.client.fetch(`/vendor/bookings/${booking.id}/inspection`, {
        method: "POST",
        body: {
          outcome,
          damage_deduction: Number(damage),
          notes: notes || undefined,
          photo_keys: photoKeys,
        },
      })

      setShowInspection(false)
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inspection failed")
    } finally {
      setPending(false)
    }
  }

  if (booking.status === "confirmed") {
    return (
      <div>
        <label className="block text-xs text-dhundla">
          Condition photos (optional)
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            onChange={(event) => setHandoverFiles(event.target.files)}
            className="mt-1 block w-full text-xs"
          />
        </label>
        <Button size="sm" className="mt-2" onClick={() => run("dispatch")} disabled={pending}>
          Mark as handed over
        </Button>
        {error ? <p className="mt-1 text-xs text-khatra">{error}</p> : null}
      </div>
    )
  }

  if (booking.status === "with_customer") {
    return (
      <div>
        <Button size="sm" onClick={() => run("return")} disabled={pending}>
          Record return
        </Button>
        {error ? <p className="mt-1 text-xs text-khatra">{error}</p> : null}
      </div>
    )
  }

  if (booking.status === "returned") {
    return (
      <div>
        {!showInspection ? (
          <Button size="sm" onClick={() => setShowInspection(true)}>
            Start check
          </Button>
        ) : (
          <form onSubmit={submitInspection} className="mt-3 space-y-3 rounded-control border border-lakeer bg-surface p-4">
            <label className="block text-sm font-medium text-syahi">
              Outcome
              <select
                value={outcome}
                onChange={(event) => setOutcome(event.target.value as typeof outcome)}
                className="mt-1 w-full rounded-control border border-lakeer px-3 py-2 text-sm"
              >
                <option value="clean">Clean</option>
                <option value="minor_damage">Minor damage</option>
                <option value="major_damage">Major damage</option>
                <option value="loss">Loss</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-syahi">
              Damage deduction (PKR)
              <input
                type="number"
                min={0}
                value={damage}
                onChange={(event) => setDamage(event.target.value)}
                className="mt-1 w-full rounded-control border border-lakeer px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm font-medium text-syahi">
              Notes
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={2}
                className="mt-1 w-full rounded-control border border-lakeer px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm font-medium text-syahi">
              Photos (3 required for major damage or loss)
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                multiple
                onChange={(event) => setFiles(event.target.files)}
                className="mt-1 block w-full text-xs"
              />
            </label>
            {error ? <p className="text-xs text-khatra">{error}</p> : null}
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={pending}>
                Submit inspection
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => setShowInspection(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    )
  }

  return null
}
