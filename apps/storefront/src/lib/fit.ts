export type MeasurementProfile = {
  id: string
  label: string
  garment_type: "women" | "men" | "kids"
  unit: "in" | "cm"
  bust_chest?: number | null
  waist?: number | null
  hips?: number | null
  shoulder?: number | null
  height?: number | null
  is_default: boolean
}

export type FitResult = {
  status: "fits" | "snug" | "check" | "unknown"
  message: string
}

function toInches(value: number | null | undefined, unit: "in" | "cm") {
  if (typeof value !== "number") return null
  return unit === "cm" ? value / 2.54 : value
}

export function fitFor(
  profile: MeasurementProfile | undefined,
  garment: Record<string, number> | undefined
): FitResult {
  if (!profile || !garment) {
    return { status: "unknown", message: "Add your measurements to see the fit." }
  }

  const profileBust = toInches(profile.bust_chest, profile.unit)
  const profileWaist = toInches(profile.waist, profile.unit)
  const profileHips = toInches(profile.hips, profile.unit)

  const checks: { label: string; mine: number | null; theirs: number | undefined }[] = [
    { label: "bust", mine: profileBust, theirs: garment.bust_in ?? garment.chest_in },
    { label: "waist", mine: profileWaist, theirs: garment.waist_in },
    { label: "hips", mine: profileHips, theirs: garment.hip_in },
  ]

  const compared = checks.filter(
    (check): check is { label: string; mine: number; theirs: number } =>
      typeof check.mine === "number" && typeof check.theirs === "number"
  )

  if (!compared.length) {
    return { status: "unknown", message: "This piece has no comparable measurements." }
  }

  const differences = compared.map((check) => ({
    label: check.label,
    diff: check.theirs - check.mine,
  }))

  const snug = differences.find((difference) => difference.diff < -1.5)

  if (snug) {
    return {
      status: "snug",
      message: `Snug at the ${snug.label}. Check with the boutique.`,
    }
  }

  const tightish = differences.find((difference) => difference.diff < 0)
  const loose = differences.find((difference) => difference.diff > 3)

  if (tightish || loose) {
    return {
      status: "check",
      message: tightish
        ? `Close at the ${tightish.label}. Ask the boutique about alterations.`
        : `Roomy at the ${loose!.label}. Check with the boutique.`,
    }
  }

  return { status: "fits", message: "Fits your measurements." }
}
