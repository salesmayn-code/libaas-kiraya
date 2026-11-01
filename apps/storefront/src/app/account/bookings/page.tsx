import type { Metadata } from "next"
import { Container } from "@/components/ui/container"
import { BookingsList } from "@/components/bookings-list"

export const metadata: Metadata = { title: "My bookings" }

export default async function BookingsPage({ searchParams }: PageProps<"/account/bookings">) {
  const params = await searchParams
  const confirmed = Array.isArray(params.confirmed) ? params.confirmed[0] : params.confirmed

  return (
    <main>
      <Container className="py-10">
        <h1 className="font-display text-4xl text-shahtoot">My bookings</h1>
        <p className="mt-2 text-sm text-dhundla">
          Every outfit, every date, and the one thing to do next.
        </p>
        {confirmed ? (
          <div className="mt-6 rounded-control border border-mor/30 bg-mor/10 p-4 text-sm text-mor">
            Payment confirmed. Your booking reference is {confirmed}. The boutique has been notified.
          </div>
        ) : null}
        <div className="mt-8">
          <BookingsList />
        </div>
      </Container>
    </main>
  )
}
