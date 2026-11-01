import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Badge, Button, Container, Heading, Text } from "@medusajs/ui"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { sdk } from "../../lib/client"

type Vendor = {
  id: string
  name: string
  handle: string
  city: string
  status: string
  kyc_status: string
  commission_bps: number
  kyc_document_keys?: string[] | null
  users?: { name: string; email: string; role: string }[]
}

const VendorsPage = () => {
  const [kycUrls, setKycUrls] = useState<Record<string, { key: string; url: string }[]>>({})
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["rental-vendors"],
    queryFn: () => sdk.client.fetch<{ vendors: Vendor[] }>("/admin/vendors?limit=100"),
  })

  const kyc = useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch<{ urls: { key: string; url: string }[] }>(
        `/admin/vendors/${id}/kyc-urls`,
        { method: "POST" }
      ),
    onSuccess: (result, id) => setKycUrls((current) => ({ ...current, [id]: result.urls })),
  })

  const approve = useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch(`/admin/vendors/${id}/approve`, { method: "POST", body: {} }),
    onSuccess: () => refetch(),
  })

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      sdk.client.fetch(`/admin/vendors/${id}/reject`, { method: "POST", body: { reason } }),
    onSuccess: () => refetch(),
  })

  return (
    <Container className="p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading>Vendors</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Approve boutiques before their listings go live.
        </Text>
      </div>
      {isLoading ? (
        <div className="px-6 py-8">
          <Text>Loading vendors…</Text>
        </div>
      ) : (
        <div className="divide-y divide-ui-border-base">
          {data?.vendors.map((vendor) => (
            <div key={vendor.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
              <div>
                <Text size="small" leading="compact" weight="plus">
                  {vendor.name} · {vendor.city}
                </Text>
                <Text size="small" leading="compact" className="text-ui-fg-subtle">
                  {vendor.handle} · {vendor.users?.[0]?.email} · {(vendor.commission_bps / 100).toFixed(2)}%
                </Text>
              </div>
              <div className="flex items-center gap-2">
                <Badge size="2xsmall">{vendor.status}</Badge>
                <Badge size="2xsmall" color={vendor.kyc_status === "verified" ? "green" : "orange"}>
                  KYC {vendor.kyc_status}
                </Badge>
                {vendor.kyc_document_keys?.length ? (
                  <Button
                    size="small"
                    variant="secondary"
                    isLoading={kyc.isPending}
                    onClick={() => kyc.mutate(vendor.id)}
                  >
                    KYC docs
                  </Button>
                ) : null}
                {vendor.status !== "active" ? (
                  <Button
                    size="small"
                    onClick={() => approve.mutate(vendor.id)}
                    isLoading={approve.isPending}
                  >
                    Approve
                  </Button>
                ) : null}
                {vendor.status !== "rejected" ? (
                  <Button
                    size="small"
                    variant="secondary"
                    onClick={() => {
                      const reason = window.prompt("Reason for rejection")
                      if (reason) reject.mutate({ id: vendor.id, reason })
                    }}
                    isLoading={reject.isPending}
                  >
                    Reject
                  </Button>
                ) : null}
              </div>
              {kycUrls[vendor.id]?.length ? (
                <div className="flex w-full gap-3 text-xs">
                  {kycUrls[vendor.id].map((document, index) => (
                    <a
                      key={document.key}
                      href={document.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-ui-fg-interactive underline"
                    >
                      Document {index + 1}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
          {!data?.vendors.length ? (
            <div className="px-6 py-8">
              <Text className="text-ui-fg-subtle">No vendors yet.</Text>
            </div>
          ) : null}
        </div>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Vendors",
})

export default VendorsPage
