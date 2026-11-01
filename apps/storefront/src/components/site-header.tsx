import Link from "next/link"
import { ShoppingBag } from "lucide-react"
import { Container } from "@/components/ui/container"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-lakeer bg-chandni/95 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-display text-2xl leading-none text-shahtoot">Libaas Kiraya</span>
          <span className="hidden text-xs text-dhundla sm:inline">Wear it once. Rent it right.</span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-6 text-sm lg:flex">
          <Link href="/search" className="text-syahi hover:text-shahtoot">
            Browse outfits
          </Link>
          <Link href="/#how-it-works" className="text-syahi hover:text-shahtoot">
            How it works
          </Link>
          <Link href="/vendor" className="text-syahi hover:text-shahtoot">
            For boutiques
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/cart"
            aria-label="Cart"
            className="inline-flex size-11 items-center justify-center rounded-control text-syahi hover:bg-shahtoot/5"
          >
            <ShoppingBag aria-hidden className="size-5" strokeWidth={1.5} />
          </Link>

          <details className="relative lg:hidden">
            <summary className="flex h-11 cursor-pointer list-none items-center rounded-control px-3 text-sm font-medium text-syahi hover:bg-shahtoot/5">
              Menu
            </summary>
            <div className="absolute right-0 top-12 w-56 rounded-control border border-lakeer bg-surface p-2 shadow-[0_8px_24px_rgba(43,34,48,.12)]">
              <Link href="/search" className="block rounded-control px-3 py-2 text-sm hover:bg-chandni">
                Browse outfits
              </Link>
              <Link
                href="/#how-it-works"
                className="block rounded-control px-3 py-2 text-sm hover:bg-chandni"
              >
                How it works
              </Link>
              <Link
                href="/vendor"
                className="block rounded-control px-3 py-2 text-sm hover:bg-chandni"
              >
                For boutiques
              </Link>
            </div>
          </details>
        </div>
      </Container>
    </header>
  )
}
