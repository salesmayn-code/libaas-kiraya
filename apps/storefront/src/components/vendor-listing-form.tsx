"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { sdk } from "@/lib/sdk"
import { uploadVendorImages } from "@/lib/vendor"

const inputClass =
  "mt-1 w-full rounded-control border border-lakeer bg-surface px-3 py-2 text-sm text-syahi outline-none focus:border-shahtoot"

export type VendorListingDetail = {
  id: string
  status: string
  city: string
  base_amount: number
  base_days: number
  extra_day_amount: number
  cleaning_fee_amount: number
  deposit_amount: number
  late_fee_amount: number
  lead_buffer_days: number
  return_buffer_days: number
  min_days: number
  max_days: number
  fulfillment_modes: string[]
  cancellation_policy: string
  occasion_tags?: string[] | null
  product?: {
    id: string
    title?: string
    description?: string | null
    thumbnail?: string | null
    images?: { url: string }[]
  }
  variants?: { id: string; size_label: string; measurements?: Record<string, number> }[]
  units?: { id: string; tag_code: string; status: string }[]
}

type VariantRow = {
  size_label: string
  bust: string
  waist: string
  hips: string
  shoulder: string
  alterable: boolean
}

type UnitRow = {
  size_label: string
  tag_code: string
}

function variantRowsFrom(listing?: VendorListingDetail): VariantRow[] {
  if (listing?.variants?.length) {
    return listing.variants.map((variant) => ({
      size_label: variant.size_label,
      bust: String(variant.measurements?.bust_in ?? ""),
      waist: String(variant.measurements?.waist_in ?? ""),
      hips: String(variant.measurements?.hip_in ?? ""),
      shoulder: String(variant.measurements?.shoulder_in ?? ""),
      alterable: true,
    }))
  }

  return [{ size_label: "M", bust: "36", waist: "30", hips: "38", shoulder: "14.5", alterable: true }]
}

export function VendorListingForm({ listing }: { listing?: VendorListingDetail }) {
  const router = useRouter()
  const editing = Boolean(listing)
  const [title, setTitle] = useState(listing?.product?.title ?? "")
  const [description, setDescription] = useState(listing?.product?.description ?? "")
  const [city, setCity] = useState(listing?.city ?? "Islamabad")
  const [baseAmount, setBaseAmount] = useState(String(listing?.base_amount ?? 15000))
  const [baseDays, setBaseDays] = useState(String(listing?.base_days ?? 3))
  const [extraDay, setExtraDay] = useState(String(listing?.extra_day_amount ?? 4000))
  const [cleaning, setCleaning] = useState(String(listing?.cleaning_fee_amount ?? 1200))
  const [deposit, setDeposit] = useState(String(listing?.deposit_amount ?? 15000))
  const [lateFee, setLateFee] = useState(String(listing?.late_fee_amount ?? 1500))
  const [minDays, setMinDays] = useState(String(listing?.min_days ?? 2))
  const [maxDays, setMaxDays] = useState(String(listing?.max_days ?? 7))
  const [leadBuffer, setLeadBuffer] = useState(String(listing?.lead_buffer_days ?? 1))
  const [returnBuffer, setReturnBuffer] = useState(String(listing?.return_buffer_days ?? 2))
  const [modes, setModes] = useState<string[]>(listing?.fulfillment_modes ?? ["pickup", "courier"])
  const [policy, setPolicy] = useState(listing?.cancellation_policy ?? "standard")
  const [occasions, setOccasions] = useState((listing?.occasion_tags ?? []).join(", "))
  const [images] = useState<string[]>(
    listing?.product?.images?.map((image) => image.url) ?? []
  )
  const [variants, setVariants] = useState<VariantRow[]>(variantRowsFrom(listing))
  const [units, setUnits] = useState<UnitRow[]>(
    listing?.units?.length
      ? listing.units.map((unit) => ({ size_label: variants[0]?.size_label ?? "M", tag_code: unit.tag_code }))
      : [{ size_label: "M", tag_code: "" }]
  )
  const [files, setFiles] = useState<FileList | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  function toggleMode(mode: string) {
    setModes((current) =>
      current.includes(mode) ? current.filter((item) => item !== mode) : [...current, mode]
    )
  }

  function updateVariant(index: number, patch: Partial<VariantRow>) {
    setVariants((current) =>
      current.map((variant, position) => (position === index ? { ...variant, ...patch } : variant))
    )
  }

  function updateUnit(index: number, patch: Partial<UnitRow>) {
    setUnits((current) =>
      current.map((unit, position) => (position === index ? { ...unit, ...patch } : unit))
    )
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    if (!modes.length) {
      setError("Choose pickup, courier, or both.")
      return
    }

    if (images.length === 0 && !files?.length) {
      setError("Add at least one photo. Publishing needs three.")
      return
    }

    setPending(true)

    try {
      let photoUrls = images

      if (files?.length) {
        photoUrls = await uploadVendorImages(files)
      }

      const core = {
        title,
        description: description || undefined,
        images: photoUrls,
        city,
        base_amount: Number(baseAmount),
        base_days: Number(baseDays),
        extra_day_amount: Number(extraDay),
        cleaning_fee_amount: Number(cleaning),
        deposit_amount: Number(deposit),
        late_fee_amount: Number(lateFee),
        lead_buffer_days: Number(leadBuffer),
        return_buffer_days: Number(returnBuffer),
        min_days: Number(minDays),
        max_days: Number(maxDays),
        fulfillment_modes: modes,
        cancellation_policy: policy,
        occasion_tags: occasions
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      }

      if (editing && listing) {
        await sdk.client.fetch(`/vendor/listings/${listing.id}`, {
          method: "POST",
          body: core,
        })
      } else {
        await sdk.client.fetch("/vendor/listings", {
          method: "POST",
          body: {
            ...core,
            variants: variants.map((variant) => ({
              size_label: variant.size_label,
              measurements: {
                ...(variant.bust ? { bust_in: Number(variant.bust) } : {}),
                ...(variant.waist ? { waist_in: Number(variant.waist) } : {}),
                ...(variant.hips ? { hip_in: Number(variant.hips) } : {}),
                ...(variant.shoulder ? { shoulder_in: Number(variant.shoulder) } : {}),
              },
              alterable: variant.alterable,
            })),
            units: units.map((unit) => ({
              size_label: unit.size_label,
              tag_code: unit.tag_code,
              condition_grade: "A",
            })),
          },
        })
      }

      router.push("/vendor/listings")
      router.refresh()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not save the listing. Check the sizes, tag codes and photos."
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="rounded-control border border-lakeer bg-surface p-5">
        <h2 className="text-sm font-semibold text-syahi">Photos</h2>
        <p className="mt-1 text-xs text-dhundla">
          The first photo becomes the cover. Publishing needs at least 3 photos.
        </p>
        {images.length ? (
          <p className="mt-2 text-xs text-dhundla">{images.length} photo(s) currently saved</p>
        ) : null}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          onChange={(event) => setFiles(event.target.files)}
          className="mt-3 block w-full text-sm"
        />
      </section>

      <section className="rounded-control border border-lakeer bg-surface p-5 space-y-4">
        <h2 className="text-sm font-semibold text-syahi">Outfit</h2>
        <label className="block text-sm font-medium text-syahi">
          Title
          <input required value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass} />
        </label>
        <label className="block text-sm font-medium text-syahi">
          Description
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            className={inputClass}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-medium text-syahi">
            City
            <select value={city} onChange={(event) => setCity(event.target.value)} className={inputClass}>
              <option>Rawalpindi</option>
              <option>Islamabad</option>
              <option>Lahore</option>
            </select>
          </label>
          <label className="block text-sm font-medium text-syahi">
            Occasions (comma separated)
            <input
              value={occasions}
              onChange={(event) => setOccasions(event.target.value)}
              placeholder="barat, walima"
              className={inputClass}
            />
          </label>
        </div>
      </section>

      <section className="rounded-control border border-lakeer bg-surface p-5 space-y-4">
        <h2 className="text-sm font-semibold text-syahi">Pricing and rules</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {(
            [
              ["Base amount", baseAmount, setBaseAmount],
              ["Base days", baseDays, setBaseDays],
              ["Extra day", extraDay, setExtraDay],
              ["Cleaning fee", cleaning, setCleaning],
              ["Deposit", deposit, setDeposit],
              ["Late fee / day", lateFee, setLateFee],
              ["Min days", minDays, setMinDays],
              ["Max days", maxDays, setMaxDays],
              ["Lead buffer", leadBuffer, setLeadBuffer],
            ] as const
          ).map(([label, value, setter]) => (
            <label key={label} className="block text-sm font-medium text-syahi">
              {label}
              <input
                type="number"
                min={0}
                value={value}
                onChange={(event) => setter(event.target.value)}
                className={inputClass}
              />
            </label>
          ))}
          <label className="block text-sm font-medium text-syahi">
            Return buffer
            <input
              type="number"
              min={0}
              value={returnBuffer}
              onChange={(event) => setReturnBuffer(event.target.value)}
              className={inputClass}
            />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-syahi">Fulfillment</p>
            <div className="mt-2 flex gap-4 text-sm">
              {["pickup", "courier"].map((mode) => (
                <label key={mode} className="flex items-center gap-2 capitalize">
                  <input type="checkbox" checked={modes.includes(mode)} onChange={() => toggleMode(mode)} />
                  {mode}
                </label>
              ))}
            </div>
          </div>
          <label className="block text-sm font-medium text-syahi">
            Cancellation policy
            <select value={policy} onChange={(event) => setPolicy(event.target.value)} className={inputClass}>
              <option value="flexible">Flexible</option>
              <option value="standard">Standard</option>
              <option value="strict">Strict</option>
            </select>
          </label>
        </div>
      </section>

      {!editing ? (
        <>
          <section className="rounded-control border border-lakeer bg-surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-syahi">Sizes and measurements</h2>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() =>
                  setVariants((current) => [
                    ...current,
                    { size_label: "", bust: "36", waist: "30", hips: "38", shoulder: "14.5", alterable: true },
                  ])
                }
              >
                Add size
              </Button>
            </div>
            <div className="mt-3 space-y-3">
              {variants.map((variant, index) => (
                <div key={index} className="grid gap-2 rounded-control border border-lakeer p-3 sm:grid-cols-6">
                  <input
                    placeholder="Size"
                    value={variant.size_label}
                    onChange={(event) => updateVariant(index, { size_label: event.target.value })}
                    className={inputClass}
                  />
                  <input
                    placeholder="Bust"
                    value={variant.bust}
                    onChange={(event) => updateVariant(index, { bust: event.target.value })}
                    className={inputClass}
                  />
                  <input
                    placeholder="Waist"
                    value={variant.waist}
                    onChange={(event) => updateVariant(index, { waist: event.target.value })}
                    className={inputClass}
                  />
                  <input
                    placeholder="Hips"
                    value={variant.hips}
                    onChange={(event) => updateVariant(index, { hips: event.target.value })}
                    className={inputClass}
                  />
                  <input
                    placeholder="Shoulder"
                    value={variant.shoulder}
                    onChange={(event) => updateVariant(index, { shoulder: event.target.value })}
                    className={inputClass}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setVariants((current) => current.filter((_, position) => position !== index))}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-control border border-lakeer bg-surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-syahi">Physical units</h2>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setUnits((current) => [...current, { size_label: variants[0]?.size_label ?? "M", tag_code: "" }])}
              >
                Add unit
              </Button>
            </div>
            <div className="mt-3 space-y-3">
              {units.map((unit, index) => (
                <div key={index} className="grid gap-2 rounded-control border border-lakeer p-3 sm:grid-cols-3">
                  <select
                    value={unit.size_label}
                    onChange={(event) => updateUnit(index, { size_label: event.target.value })}
                    className={inputClass}
                  >
                    {variants.map((variant) => (
                      <option key={variant.size_label} value={variant.size_label}>
                        {variant.size_label}
                      </option>
                    ))}
                  </select>
                  <input
                    placeholder="Tag code, e.g. LEH-014"
                    required
                    value={unit.tag_code}
                    onChange={(event) => updateUnit(index, { tag_code: event.target.value })}
                    className={inputClass}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setUnits((current) => current.filter((_, position) => position !== index))}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
        <p className="text-xs text-dhundla">
          Sizes and physical units are managed separately after creation.
        </p>
      )}

      {error ? <p className="text-sm text-khatra">{error}</p> : null}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : editing ? "Save changes" : "Create listing"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push("/vendor/listings")}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
