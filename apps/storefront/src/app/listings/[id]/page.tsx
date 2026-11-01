import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { MapPin, Star } from "lucide-react"
import { BookingPanel } from "@/components/booking-panel"
import { Container } from "@/components/ui/container"
import { fetchListing, listingImages } from "@/lib/rentals"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: PageProps<"/listings/[id]">): Promise<Metadata> {
  const { id } = await params

  try {
    const { listing } = await fetchListing(id)
    return {
      title: listing.product.title,
      description: listing.product.description ?? undefined,
    }
  } catch {
    return { title: "Listing" }
  }
}

export default async function ListingPage({ params }: PageProps<"/listings/[id]">) {
  const { id } = await params

  let listing

  try {
    const result = await fetchListing(id)
    listing = result.listing
  } catch {
    notFound()
  }

  const images = listingImages(listing)
  const hero = images[0]
  const vendor = listing.product.vendor

  return (
    <main className="pb-16">
      <Container className="py-6">
        <nav aria-label="Breadcrumb" className="text-sm text-dhundla">
          <Link href="/search" className="hover:text-shahtoot">
            Search
          </Link>
          <span aria-hidden> / </span>
          <span className="text-syahi">{listing.product.title}</span>
        </nav>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_.9fr] lg:gap-12">
          <div>
            <div className="relative aspect-[4/5] overflow-hidden rounded-image bg-sang">
              {hero ? (
                <Image
                  src={hero}
                  alt={listing.product.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="object-cover"
                />
              ) : null}
            </div>

            {images.length > 1 ? (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {images.slice(1, 4).map((image, index) => (
                  <div
                    key={`${image}-${index}`}
                    className="relative aspect-[4/3] overflow-hidden rounded-image bg-sang"
                  >
                    <Image
                      src={image}
                      alt={`${listing.product.title} view ${index + 2}`}
                      fill
                      sizes="20vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div>
            <p className="text-sm text-dhundla">
              {vendor?.name ?? "Boutique"}
              {vendor?.city ? ` · ${vendor.city}` : ` · ${listing.city}`}
            </p>
            <h1 className="mt-2 font-display text-4xl leading-tight text-shahtoot sm:text-5xl">
              {listing.product.title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-dhundla">
              <span className="inline-flex items-center gap-1">
                <Star aria-hidden className="size-4 text-zari" strokeWidth={1.5} />
                {listing.rating_count > 0
                  ? `${listing.rating_avg.toFixed(1)} (${listing.rating_count})`
                  : "New listing"}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin aria-hidden className="size-4" strokeWidth={1.5} />
                {listing.city}
              </span>
            </div>

            <div className="mt-6">
              <BookingPanel listing={listing} />
            </div>

            {listing.product.description ? (
              <section className="mt-8 border-t border-lakeer pt-6">
                <h2 className="text-sm font-semibold text-syahi">About this piece</h2>
                <p className="mt-2 text-sm leading-relaxed text-dhundla">
                  {listing.product.description}
                </p>
              </section>
            ) : null}

            <section className="mt-6 border-t border-lakeer pt-6">
              <h2 className="text-sm font-semibold text-syahi">Rental terms</h2>
              <dl className="mt-3 space-y-2 text-sm text-dhundla">
                <div className="flex justify-between gap-3">
                  <dt>Minimum</dt>
                  <dd className="text-syahi">{listing.min_days} days</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Maximum</dt>
                  <dd className="text-syahi">{listing.max_days} days</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Cancellation</dt>
                  <dd className="text-syahi capitalize">{listing.cancellation_policy}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Fulfillment</dt>
                  <dd className="text-syahi capitalize">
                    {listing.fulfillment_modes.join(" or ")}
                  </dd>
                </div>
              </dl>
            </section>
          </div>
        </div>
      </Container>
    </main>
  )
}
