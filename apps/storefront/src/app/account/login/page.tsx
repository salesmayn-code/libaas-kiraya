import type { Metadata } from "next"
import Link from "next/link"
import { Container } from "@/components/ui/container"
import { LoginForm } from "@/components/auth-forms"

export const metadata: Metadata = { title: "Sign in" }

export default async function LoginPage({ searchParams }: PageProps<"/account/login">) {
  const params = await searchParams
  const next = Array.isArray(params.next) ? params.next[0] : params.next

  return (
    <main>
      <Container className="py-14">
        <div className="mx-auto max-w-md">
          <h1 className="font-display text-4xl text-shahtoot">Sign in</h1>
          <p className="mt-2 text-sm text-dhundla">
            Your bookings, measurements and deposit decisions live here.
          </p>
          <div className="mt-8 rounded-control border border-lakeer bg-surface p-6">
            <LoginForm next={next ?? "/account/bookings"} />
          </div>
          <p className="mt-4 text-sm text-dhundla">
            New here?{" "}
            <Link href="/account/register" className="font-medium text-shahtoot hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </Container>
    </main>
  )
}
