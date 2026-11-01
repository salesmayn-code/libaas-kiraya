import Link from "next/link"
import { Container } from "@/components/ui/container"

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-lakeer bg-surface">
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <p className="font-display text-2xl text-shahtoot">Libaas Kiraya</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-dhundla">
            Occasion wear rental for weddings that deserve the real thing. Date-accurate
            availability, protected deposits, and boutiques that get paid on time.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-syahi">Rent</p>
          <ul className="mt-3 space-y-2 text-sm text-dhundla">
            <li>
              <Link href="/search" className="hover:text-shahtoot">
                Browse outfits
              </Link>
            </li>
            <li>
              <Link href="/#how-it-works" className="hover:text-shahtoot">
                How it works
              </Link>
            </li>
            <li>
              <Link href="/account/bookings" className="hover:text-shahtoot">
                My bookings
              </Link>
            </li>
            <li>
              <Link href="/account/measurements" className="hover:text-shahtoot">
                Measurements
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-syahi">Boutiques</p>
          <ul className="mt-3 space-y-2 text-sm text-dhundla">
            <li>
              <Link href="/vendor" className="hover:text-shahtoot">
                List your outfits
              </Link>
            </li>
            <li>
              <Link href="/vendor" className="hover:text-shahtoot">
                Vendor sign in
              </Link>
            </li>
          </ul>
        </div>
      </Container>
      <Container className="flex flex-col gap-2 border-t border-lakeer py-6 text-xs text-dhundla sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Libaas Kiraya. Made for weddings across Pakistan.</p>
        <p>Prices in PKR. Demo marketplace.</p>
      </Container>
    </footer>
  )
}
