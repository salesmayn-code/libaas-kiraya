import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "../../lib/client"

type Metrics = {
  bookings_today: number
  active_bookings: number
  overdue: number
  open_disputes: number
  gmv: number
  take_rate: number
}

const RentalOpsPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["rental-metrics"],
    queryFn: () => sdk.client.fetch<Metrics>("/admin/rental-metrics"),
  })

  const cards: { label: string; value: string }[] = [
    { label: "Bookings today", value: String(data?.bookings_today ?? 0) },
    { label: "Active bookings", value: String(data?.active_bookings ?? 0) },
    { label: "Overdue returns", value: String(data?.overdue ?? 0) },
    { label: "Open disputes", value: String(data?.open_disputes ?? 0) },
    { label: "GMV", value: `PKR ${Number(data?.gmv ?? 0).toLocaleString("en-PK")}` },
    { label: "Platform take", value: `PKR ${Number(data?.take_rate ?? 0).toLocaleString("en-PK")}` },
  ]

  return (
    <Container className="p-0">
      <div className="px-6 py-4">
        <Heading>Rental operations</Heading>
        <Text size="small" className="mt-1 text-ui-fg-subtle">
          Today&apos;s handovers, overdue returns, disputes and marketplace money.
        </Text>
      </div>
      <div className="grid grid-cols-2 gap-4 px-6 pb-6 lg:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-lg border border-ui-border-base p-4">
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              {card.label}
            </Text>
            <Text size="large" leading="compact" weight="plus" className="mt-2">
              {isLoading ? "—" : card.value}
            </Text>
          </div>
        ))}
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Rental ops",
})

export default RentalOpsPage
