import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Badge, Button, Container, Heading, Input, Select, Text } from "@medusajs/ui"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { sdk } from "../../lib/client"

type Payout = {
  id: string
  vendor_id: string
  amount: number
  status: string
  reference?: string | null
  created_at: string
}

type Vendor = {
  id: string
  name: string
}

const PayoutsPage = () => {
  const [vendorId, setVendorId] = useState("")
  const [periodStart, setPeriodStart] = useState("")
  const [periodEnd, setPeriodEnd] = useState("")

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["rental-payouts"],
    queryFn: () => sdk.client.fetch<{ payouts: Payout[] }>("/admin/payouts?limit=100"),
  })

  const { data: vendors } = useQuery({
    queryKey: ["rental-payout-vendors"],
    queryFn: () => sdk.client.fetch<{ vendors: Vendor[] }>("/admin/vendors?limit=100"),
  })

  const create = useMutation({
    mutationFn: () =>
      sdk.client.fetch("/admin/payouts", {
        method: "POST",
        body: {
          vendor_id: vendorId,
          period_start: periodStart,
          period_end: periodEnd,
        },
      }),
    onSuccess: () => refetch(),
  })

  const approve = useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch(`/admin/payouts/${id}/approve`, { method: "POST" }),
    onSuccess: () => refetch(),
  })

  const markPaid = useMutation({
    mutationFn: ({ id, reference }: { id: string; reference: string }) =>
      sdk.client.fetch(`/admin/payouts/${id}/mark-paid`, {
        method: "POST",
        body: { reference },
      }),
    onSuccess: () => refetch(),
  })

  return (
    <Container className="p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading>Payouts</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Approve, transfer outside the system, then record the reference.
        </Text>
      </div>
      <div className="flex flex-wrap items-end gap-3 border-b border-ui-border-base px-6 py-4">
        <div className="min-w-[220px]">
          <Text size="small" leading="compact" weight="plus" className="mb-1">
            Vendor
          </Text>
          <Select value={vendorId} onValueChange={setVendorId}>
            <Select.Trigger>
              <Select.Value placeholder="Choose vendor" />
            </Select.Trigger>
            <Select.Content>
              {vendors?.vendors.map((vendor) => (
                <Select.Item key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>
        <div>
          <Text size="small" leading="compact" weight="plus" className="mb-1">
            Period start
          </Text>
          <Input type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} />
        </div>
        <div>
          <Text size="small" leading="compact" weight="plus" className="mb-1">
            Period end
          </Text>
          <Input type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} />
        </div>
        <Button
          size="small"
          disabled={!vendorId || !periodStart || !periodEnd}
          isLoading={create.isPending}
          onClick={() => create.mutate()}
        >
          Create draft batch
        </Button>
        {create.isError ? (
          <Text size="small" className="text-ui-fg-error">
            Could not create: check the available balance and minimum payout.
          </Text>
        ) : null}
      </div>
      {isLoading ? (
        <div className="px-6 py-8">
          <Text>Loading payouts…</Text>
        </div>
      ) : (
        <div className="divide-y divide-ui-border-base">
          {data?.payouts.map((payout) => (
            <div key={payout.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
              <div>
                <Text size="small" leading="compact" weight="plus">
                  PKR {Number(payout.amount).toLocaleString("en-PK")}
                </Text>
                <Text size="small" leading="compact" className="text-ui-fg-subtle">
                  Vendor {payout.vendor_id} · {new Date(payout.created_at).toLocaleDateString()}
                  {payout.reference ? ` · ${payout.reference}` : ""}
                </Text>
              </div>
              <div className="flex items-center gap-2">
                <Badge size="2xsmall">{payout.status}</Badge>
                {payout.status === "draft" ? (
                  <Button size="small" onClick={() => approve.mutate(payout.id)} isLoading={approve.isPending}>
                    Approve
                  </Button>
                ) : null}
                {payout.status === "approved" ? (
                  <Button
                    size="small"
                    onClick={() => {
                      const reference = window.prompt("Transfer reference")
                      if (reference) markPaid.mutate({ id: payout.id, reference })
                    }}
                    isLoading={markPaid.isPending}
                  >
                    Mark paid
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
          {!data?.payouts.length ? (
            <div className="px-6 py-8">
              <Text className="text-ui-fg-subtle">No payouts yet.</Text>
            </div>
          ) : null}
        </div>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Payouts",
})

export default PayoutsPage
