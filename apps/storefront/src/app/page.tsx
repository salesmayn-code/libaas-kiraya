import Link from "next/link"
import { ArrowRight, BadgeCheck, CalendarCheck, ShieldCheck } from "lucide-react"
import { Container } from "@/components/ui/container"
import { buttonStyles } from "@/components/ui/button"
import { ListingCard } from "@/components/listing-card"
import { SearchForm } from "@/components/search-form"
import { fetchListings } from "@/lib/rentals"

export const dynamic = "force-dynamic"

async function FeaturedListings() {
  let listings = [] as Awaited<ReturnType<typeof fetchListings>>["listings"]
  let failed = false

  try {
    const result = await fetchListings({ limit: 8 })
    listings = result.listings
  } catch {
    failed = true
  }

  if (failed) {
    return (
      <section className="border-t border-lakeer py-14">
        <Container>
          <div className="rounded-control border border-dashed border-lakeer bg-surface p-8 text-center">
            <p className="font-medium text-syahi">The catalog is waking up</p>
            <p className="mt-2 text-sm text-dhundla">
              Start the backend and seed the demo data to see outfits here.
            </p>
          </div>
        </Container>
      </section>
    )
  }

  if (!listings.length) {
    return null
  }

  return (
    <section className="border-t border-lakeer py-14 sm:py-16">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl text-shahtoot sm:text-4xl">Recently added</h2>
            <p className="mt-2 text-sm text-dhundla">
              A first look at what boutiques are renting this season.
            </p>
          </div>
          <Link href="/search" className={buttonStyles({ variant: "ghost", size: "sm" })}>
            Browse all
            <ArrowRight aria-hidden className="size-4" strokeWidth={1.5} />
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </Container>
    </section>
  )
}

export default function HomePage() {
  return (
    <main>
      <section className="border-b border-lakeer">
        <Container className="grid items-center gap-10 py-10 sm:py-14 lg:grid-cols-[1.05fr_.95fr] lg:gap-16 lg:py-20">
          <div>
            <p className="text-sm text-dhundla">
              Occasion wear rental · Rawalpindi, Islamabad, Lahore
            </p>
            <h1 className="mt-4 max-w-xl font-display text-4xl leading-[1.08] text-balance text-shahtoot sm:text-5xl lg:text-6xl">
              When is the wedding?
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-dhundla">
              Pick the date first. We show only the lehngas, sherwanis and jewellery that are
              actually free — for the whole rental window, buffers included.
            </p>
            <div className="mt-8">
              <SearchForm />
            </div>
          </div>

          <div
            aria-hidden
            className="relative min-h-[360px] overflow-hidden rounded-image bg-shahtoot sm:min-h-[440px]"
          >
            <div
              className="absolute inset-0 opacity-50"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, transparent 0 18px, rgba(201,154,46,.22) 18px 19px), repeating-linear-gradient(-45deg, transparent 0 18px, rgba(201,154,46,.16) 18px 19px), radial-gradient(circle at 70% 20%, rgba(14,111,106,.55), transparent 45%)",
              }}
            />
            <div className="absolute inset-5 border border-zari/40" />
            <div className="absolute inset-x-5 bottom-5 bg-gradient-to-t from-shahtoot via-shahtoot/85 to-transparent p-6 pt-16">
              <p className="font-display text-3xl leading-tight text-white">
                Wear it once.
                <br />
                Rent it right.
              </p>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/75">
                Every booking blocks one physical outfit for your dates. No double-bookings, no
                WhatsApp guessing.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <FeaturedListings />

      <section id="how-it-works" className="border-t border-lakeer py-14 sm:py-20">
        <Container>
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl text-shahtoot sm:text-4xl">
              The outfit is the easy part.
            </h2>
            <p className="mt-3 text-dhundla">
              The hard part is knowing it is free, it fits, and the deposit comes back. Here is
              how Libaas Kiraya handles each one.
            </p>
          </div>

          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="border-t border-lakeer pt-5">
              <CalendarCheck aria-hidden className="size-6 text-mor" strokeWidth={1.5} />
              <h3 className="mt-4 text-lg font-semibold text-syahi">Dates that hold</h3>
              <p className="mt-2 text-sm leading-relaxed text-dhundla">
                Reserve the outfit for 15 minutes while you check out. If someone else is faster,
                you see it immediately and get another size or date.
              </p>
            </div>
            <div className="border-t border-lakeer pt-5">
              <ShieldCheck aria-hidden className="size-6 text-mor" strokeWidth={1.5} />
              <h3 className="mt-4 text-lg font-semibold text-syahi">A deposit with rules</h3>
              <p className="mt-2 text-sm leading-relaxed text-dhundla">
                The boutique has 48 hours to inspect after return. You have 72 hours to accept or
                dispute. Silence returns your deposit in full.
              </p>
            </div>
            <div className="border-t border-lakeer pt-5">
              <BadgeCheck aria-hidden className="size-6 text-mor" strokeWidth={1.5} />
              <h3 className="mt-4 text-lg font-semibold text-syahi">Boutiques that get paid</h3>
              <p className="mt-2 text-sm leading-relaxed text-dhundla">
                Earnings move from pending to available when the deposit settles, then into a
                payout batch with a reference you can audit.
              </p>
            </div>
          </div>

          <div className="mt-10">
            <Link href="/search" className={buttonStyles({ variant: "secondary" })}>
              See what is free this week
              <ArrowRight aria-hidden className="size-4" strokeWidth={1.5} />
            </Link>
          </div>
        </Container>
      </section>

      <section className="border-y border-lakeer bg-shahtoot py-14 text-white sm:py-16">
        <Container className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
          <div className="max-w-xl">
            <h2 className="font-display text-3xl sm:text-4xl">Have outfits sitting idle?</h2>
            <p className="mt-3 text-white/75">
              Put your calendar online, take deposits without awkward conversations, and let the
              ledger keep track of what you are owed.
            </p>
          </div>
          <Link
            href="/vendor"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-control bg-white px-6 font-medium text-shahtoot hover:bg-chandni"
          >
            List with Libaas Kiraya
            <ArrowRight aria-hidden className="size-4" strokeWidth={1.5} />
          </Link>
        </Container>
      </section>
    </main>
  )
}
