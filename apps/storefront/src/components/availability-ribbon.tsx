import { cn } from "@/lib/utils"

const DAYS = 14

export function AvailabilityRibbon({
  states,
  startLabel,
  className,
}: {
  states?: ("free" | "taken" | "preparing" | "past" | "selected" | "unknown")[]
  startLabel?: string
  className?: string
}) {
  const cells = Array.from({ length: DAYS }, (_, index) => states?.[index] ?? "unknown")

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className="grid grid-cols-[repeat(14,minmax(0,1fr))] gap-px"
        role="img"
        aria-label="14 day availability ribbon"
      >
        {cells.map((state, index) => (
          <span
            key={index}
            className={cn(
              "h-6 border-b-2",
              state === "free" && "border-mor bg-mor/25",
              state === "selected" && "border-shahtoot bg-shahtoot",
              state === "taken" && "border-dhundla/40 bg-sang",
              state === "preparing" && "border-dhundla/25 bg-lakeer",
              state === "past" && "border-lakeer bg-chandni",
              state === "unknown" && "border-lakeer bg-lakeer/60"
            )}
          />
        ))}
      </div>
      <p className="text-xs text-dhundla">
        {startLabel ? `Availability from ${startLabel}` : "Choose a date to see availability"}
      </p>
    </div>
  )
}
