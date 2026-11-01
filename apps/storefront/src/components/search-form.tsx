"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CalendarDays, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"

const CITIES = ["Rawalpindi", "Islamabad", "Lahore"] as const

function todayInPakistan() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

export function SearchForm({
  compact = false,
  initialDate = "",
  initialCity = CITIES[0],
}: {
  compact?: boolean
  initialDate?: string
  initialCity?: string
}) {
  const router = useRouter()
  const [date, setDate] = useState(initialDate)
  const [city, setCity] = useState(initialCity)

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const params = new URLSearchParams()
    if (date) params.set("date", date)
    params.set("city", city)
    router.push(`/search?${params.toString()}`)
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-lg" aria-label="Search rentals by date and city">
      <div className={compact ? "flex flex-col gap-2 sm:flex-row" : "space-y-2"}>
        <label className="flex flex-1 items-center gap-3 rounded-control border border-lakeer bg-surface px-4 py-3 focus-within:border-shahtoot">
          <CalendarDays aria-hidden className="size-5 shrink-0 text-dhundla" strokeWidth={1.5} />
          <span className="sr-only">Event date</span>
          <input
            type="date"
            name="date"
            value={date}
            min={todayInPakistan()}
            onChange={(event) => setDate(event.target.value)}
            className="w-full bg-transparent text-base text-syahi outline-none"
            aria-label="Event date"
          />
        </label>

        <label className="flex flex-1 items-center gap-3 rounded-control border border-lakeer bg-surface px-4 py-3 focus-within:border-shahtoot">
          <MapPin aria-hidden className="size-5 shrink-0 text-dhundla" strokeWidth={1.5} />
          <span className="sr-only">City</span>
          <select
            name="city"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            className="w-full appearance-none bg-transparent text-base text-syahi outline-none"
            aria-label="City"
          >
            {CITIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <Button type="submit" size="lg" className="mt-3 w-full sm:w-auto">
        Show what&apos;s free
      </Button>
      <p className="mt-2 text-xs text-dhundla">
        Availability is checked for the whole rental window, including cleaning days.
      </p>
    </form>
  )
}
