import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Badge, Button, Container, Heading, Text } from "@medusajs/ui"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { sdk } from "../../lib/client"

type Dispute = {
  id: string
  reason: string
  status: string
  opened_at: string
  inspection?: {
    total_deduction: number
    outcome: string
    booking?: {
      id: string
      deposit_amount: number
      listing?: { product?: { title?: string; vendor?: { name?: string } } }
    }
  }
}

type Evidence = { handover: { key: string; url: string }[]; inspection: { key: string; url: string }[]; customer: { key: string; url: string }[] }

const DisputesPage = () => {
  const [evidence, setEvidence] = useState<Record<string, Evidence>>({})
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["rental-disputes"],
    queryFn: () =>
      sdk.client.fetch<{ disputes: Dispute[] }>("/admin/disputes?limit=100&status=open"),
  })

  const resolve = useMutation({
    mutationFn: ({
      id,
      resolution,
      resolved_deduction,
    }: {
      id: string
      resolution: "customer" | "vendor" | "split"
      resolved_deduction: number
    }) =>
      sdk.client.fetch(`/admin/disputes/${id}/resolve`, {
        method: "POST",
        body: { resolution, resolved_deduction, admin_notes: "Resolved from admin queue" },
      }),
    onSuccess: () => refetch(),
  })

  const loadEvidence = useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch<Evidence>(`/admin/disputes/${id}/evidence`),
    onSuccess: (result, id) =>
      setEvidence((current) => ({ ...current, [id]: result })),
  })

  return (
    <Container className="p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading>Disputes</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Compare the evidence and settle the deduction.
        </Text>
      </div>
      {isLoading ? (
        <div className="px-6 py-8">
          <Text>Loading disputes…</Text>
        </div>
      ) : (
        <div className="divide-y divide-ui-border-base">
          {data?.disputes.map((dispute) => (
            <div key={dispute.id} className="px-6 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Text size="small" leading="compact" weight="plus">
                    {dispute.inspection?.booking?.listing?.product?.title ?? "Booking"}
                  </Text>
                  <Text size="small" leading="compact" className="text-ui-fg-subtle">
                    {dispute.inspection?.booking?.listing?.product?.vendor?.name} ·{" "}
                    {dispute.inspection?.outcome} · proposed deduction{" "}
                    {dispute.inspection?.total_deduction ?? 0}
                  </Text>
                  <Text size="small" leading="compact" className="mt-1">
                    “{dispute.reason}”
                  </Text>
                </div>
                <Badge size="2xsmall">{dispute.status}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="small"
                  variant="secondary"
                  isLoading={loadEvidence.isPending}
                  onClick={() => loadEvidence.mutate(dispute.id)}
                >
                  Evidence
                </Button>
                <Button
                  size="small"
                  variant="secondary"
                  onClick={() =>
                    resolve.mutate({ id: dispute.id, resolution: "customer", resolved_deduction: 0 })
                  }
                  isLoading={resolve.isPending}
                >
                  Customer wins
                </Button>
                <Button
                  size="small"
                  onClick={() =>
                    resolve.mutate({
                      id: dispute.id,
                      resolution: "vendor",
                      resolved_deduction: dispute.inspection?.total_deduction ?? 0,
                    })
                  }
                  isLoading={resolve.isPending}
                >
                  Vendor wins
                </Button>
              </div>
              {evidence[dispute.id] ? (
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  {(
                    [
                      ["Handover", evidence[dispute.id].handover],
                      ["Return inspection", evidence[dispute.id].inspection],
                      ["Customer evidence", evidence[dispute.id].customer],
                    ] as const
                  ).map(([label, files]) => (
                    <div key={label}>
                      <Text size="small" leading="compact" weight="plus">
                        {label} ({files.length})
                      </Text>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {files.map((file) => (
                          <a key={file.key} href={file.url} target="_blank" rel="noreferrer">
                            <img
                              src={file.url}
                              alt={`${label} evidence`}
                              className="h-24 w-24 rounded-md object-cover"
                            />
                          </a>
                        ))}
                        {!files.length ? (
                          <Text size="small" className="text-ui-fg-subtle">
                            No photos
                          </Text>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
          {!data?.disputes.length ? (
            <div className="px-6 py-8">
              <Text className="text-ui-fg-subtle">No open disputes.</Text>
            </div>
          ) : null}
        </div>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Disputes",
})

export default DisputesPage
