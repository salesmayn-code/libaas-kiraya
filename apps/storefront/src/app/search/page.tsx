import type { Metadata } from "next"
import { Container } from "@/components/ui/container"
import { ListingCard } from "@/components/listing-card"
import { SearchForm } from "@/components/search-form"
import { fetchListings, searchListings } from "@/lib/rentals"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Search",
}

function formatDate(value: string | undefined) {
  if (!value) return null
  const date = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat("en-PK", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(date)
}

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const params = await searchParams
  const dateParam = Array.isArray(params.date) ? params.date[0] : params.date
  const cityParam = Array.isArray(params.city) ? params.city[0] : params.city
  const date = formatDate(dateParam)

  let listings = [] as Awaited<ReturnType<typeof fetchListings>>["listings"]
  let failed = false

  try {
    const result = dateParam
      ? await searchListings({ date: dateParam, city: cityParam, limit: 32 })
      : await fetchListings({ city: cityParam, limit: 32 })
    listings = result.listings
  } catch {
    failed = true
  }

  return (
    <main>
      <div className="border-b border-lakeer bg-surface">
        <Container className="py-6">
          <p className="text-sm text-dhundla">Search</p>
          <h1 className="mt-1 font-display text-3xl text-shahtoot sm:text-4xl">
            {date ? `Free on ${date}` : "Find something free"}
            {cityParam ? ` in ${cityParam}` : ""}
          </h1>
          <div className="mt-5 max-w-2xl">
            <SearchForm
              compact
              initialDate={dateParam ?? ""}
              initialCity={cityParam ?? "Rawalpindi"}
            />
          </div>
          <p className="mt-4 text-sm text-dhundla">
            {dateParam
              ? "Every result below has at least one unit free for a 3-day rental around your event, buffers included."
              : "Choose an event date to check the real calendar. Without a date, this shows every outfit in the city."}
          </p>
        </Container>
      </div>

      <Container className="py-10">
        {failed ? (
          <div className="rounded-control border border-dashed border-lakeer bg-surface p-8 text-center">
            <p className="text-lg font-medium text-syahi">Couldn&apos;t load availability</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-dhundla">
              Check your connection and try again.
            </p>
          </div>
        ) : listings.length ? (
          <>
            <p className="text-sm text-dhundla">
              {listings.length} {listings.length === 1 ? "outfit" : "outfits"} in{" "}
              {cityParam ?? "Pakistan"}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} date={dateParam} />
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-control border border-dashed border-lakeer bg-surface p-8 text-center">
            <p className="text-lg font-medium text-syahi">
              Nothing is listed in {cityParam ?? "this city"} yet
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-dhundla">
              Try another city, or come back after more boutiques publish their calendars.
            </p>
          </div>
        )}
      </Container>
    </main>
  )
}
