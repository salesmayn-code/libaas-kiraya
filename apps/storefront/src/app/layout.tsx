import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "Libaas Kiraya — Wear it once. Rent it right.",
    template: "%s · Libaas Kiraya",
  },
  description:
    "Rent bridal and formal occasion wear in Rawalpindi, Islamabad and Lahore. Date-accurate availability, protected deposits, and a fair return check.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  )
}
