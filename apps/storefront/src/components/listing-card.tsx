import Image from "next/image"
import Link from "next/link"
import { addDays, format, parseISO } from "date-fns"
import { AvailabilityRibbon } from "@/components/availability-ribbon"
import { formatPKR, listingImages, primarySize, type RentalListing } from "@/lib/rentals"

export function ListingCard({
  listing,
  date,
}: {
  listing: RentalListing
  date?: string
}) {
  const image = listingImages(listing)[0]
  const states = date
    ? Array.from({ length: 14 }, (_, index) => {
        const day = format(addDays(parseISO(date), index), "yyyy-MM-dd")
        return listing.free_dates?.includes(day) ? ("free" as const) : ("taken" as const)
      })
    : undefined

  return (
    <article className="group">
      <Link href={`/listings/${listing.id}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-image bg-sang">
          {image ? (
            <Image
              src={image}
              alt={listing.product.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-sang to-lakeer" />
          )}
        </div>
        <div className="mt-3">
          <p className="text-xs text-dhundla">
            {listing.product.vendor?.name ?? "Boutique"} · {listing.city}
          </p>
          <h3 className="mt-1 text-base font-semibold leading-snug text-syahi group-hover:text-shahtoot">
            {listing.product.title}
          </h3>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <p className="font-semibold text-syahi">{formatPKR(listing.base_amount)}</p>
            <p className="text-xs text-dhundla">
              {primarySize(listing)} · {listing.base_days} days
            </p>
          </div>
          <p className="mt-1 text-xs text-dhundla">
            Refundable deposit {formatPKR(listing.deposit_amount)}
          </p>
          <AvailabilityRibbon
            className="mt-3"
            states={states}
            startLabel={date ? format(parseISO(date), "d MMM") : undefined}
          />
        </div>
      </Link>
    </article>
  )
}
