"use client"

import { useEffect, useState } from "react"
import { VendorShell } from "@/components/vendor-shell"
import { formatPKR } from "@/lib/rentals"
import { sdk } from "@/lib/sdk"

type LedgerEntry = {
  id: string
  created_at: string
  type: string
  amount: number
  status: string
  memo?: string | null
}

type Payout = {
  id: string
  amount: number
  status: string
  reference?: string | null
  created_at: string
}

type Earnings = {
  balances: { pending: number; available: number; paid: number }
  entries: LedgerEntry[]
  payouts: Payout[]
}

export default function VendorEarningsPage() {
  const [data, setData] = useState<Earnings | null>(null)

  useEffect(() => {
    sdk.client
      .fetch<Earnings>("/vendor/earnings")
      .then(setData)
      .catch(() => setData(null))
  }, [])

  return (
    <VendorShell
      title="Earnings"
      subtitle="Pending becomes available when the deposit settles."
    >
      {!data ? (
        <p className="text-sm text-dhundla">Loading earnings…</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            {(
              [
                ["Pending", data.balances.pending],
                ["Available", data.balances.available],
                ["Paid out", data.balances.paid],
              ] as const
            ).map(([label, amount]) => (
              <div key={label} className="rounded-control border border-lakeer bg-surface p-5">
                <p className="text-xs text-dhundla">{label}</p>
                <p className="mt-2 font-display text-2xl text-shahtoot">{formatPKR(amount)}</p>
              </div>
            ))}
          </div>

          <h2 className="mt-8 text-sm font-semibold text-syahi">Ledger</h2>
          <div className="mt-3 overflow-x-auto rounded-control border border-lakeer bg-surface">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-lakeer text-xs text-dhundla">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Memo</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-lakeer last:border-0">
                    <td className="px-4 py-3 text-dhundla">
                      {new Date(entry.created_at).toLocaleDateString("en-PK")}
                    </td>
                    <td className="px-4 py-3 capitalize text-syahi">
                      {entry.type.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3 text-dhundla">{entry.memo ?? "—"}</td>
                    <td className={entry.amount < 0 ? "px-4 py-3 text-khatra" : "px-4 py-3 text-mor"}>
                      {formatPKR(entry.amount)}
                    </td>
                    <td className="px-4 py-3 capitalize text-dhundla">{entry.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="mt-8 text-sm font-semibold text-syahi">Payouts</h2>
          <ul className="mt-3 space-y-2">
            {data.payouts.map((payout) => (
              <li
                key={payout.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-lakeer bg-surface px-4 py-3 text-sm"
              >
                <span className="text-dhundla">
                  {new Date(payout.created_at).toLocaleDateString("en-PK")} ·{" "}
                  <span className="capitalize text-syahi">{payout.status}</span>
                </span>
                <span className="font-medium text-shahtoot">{formatPKR(payout.amount)}</span>
                <span className="text-xs text-dhundla">{payout.reference ?? "No reference yet"}</span>
              </li>
            ))}
            {!data.payouts.length ? (
              <li className="text-sm text-dhundla">No payouts yet.</li>
            ) : null}
          </ul>
        </>
      )}
    </VendorShell>
  )
}
