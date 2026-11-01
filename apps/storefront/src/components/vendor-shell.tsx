"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { sdk } from "@/lib/sdk"

const NAV = [
  { href: "/vendor/today", label: "Today" },
  { href: "/vendor/bookings", label: "Bookings" },
  { href: "/vendor/listings", label: "Listings" },
  { href: "/vendor/earnings", label: "Earnings" },
]

type VendorProfile = {
  vendor_user: { id: string; name: string; email: string; role: string }
  vendor: { id: string; name: string; status: string; city: string }
}

export function VendorShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode
  title: string
  subtitle?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [profile, setProfile] = useState<VendorProfile | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true

    sdk.client
      .fetch<VendorProfile>("/vendor/me")
      .then((data) => {
        if (active) setProfile(data)
      })
      .catch(() => {
        if (active) {
          setFailed(true)
          router.push("/vendor/login")
        }
      })

    return () => {
      active = false
    }
  }, [router])

  if (failed) {
    return null
  }

  if (!profile) {
    return <p className="p-8 text-sm text-dhundla">Loading vendor portal…</p>
  }

  return (
    <div className="min-h-[70vh] bg-chandni">
      <div className="border-b border-lakeer bg-surface">
        <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs text-dhundla">Vendor portal</p>
            <p className="font-display text-2xl text-shahtoot">{profile.vendor.name}</p>
          </div>
          <nav aria-label="Vendor" className="flex flex-wrap gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-control px-3 py-2 text-sm",
                  pathname === item.href
                    ? "bg-shahtoot text-white"
                    : "text-syahi hover:bg-chandni"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <span className="rounded-full bg-chandni px-3 py-1 text-xs capitalize text-dhundla">
            {profile.vendor.status}
          </span>
        </div>
      </div>
      <div className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl text-shahtoot">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-dhundla">{subtitle}</p> : null}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  )
}
