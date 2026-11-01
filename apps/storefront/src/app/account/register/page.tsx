import type { Metadata } from "next"
import Link from "next/link"
import { Container } from "@/components/ui/container"
import { RegisterForm } from "@/components/auth-forms"

export const metadata: Metadata = { title: "Create an account" }

export default function RegisterPage() {
  return (
    <main>
      <Container className="py-14">
        <div className="mx-auto max-w-md">
          <h1 className="font-display text-4xl text-shahtoot">Create an account</h1>
          <p className="mt-2 text-sm text-dhundla">
            Save your measurements once and keep every booking in one place.
          </p>
          <div className="mt-8 rounded-control border border-lakeer bg-surface p-6">
            <RegisterForm />
          </div>
          <p className="mt-4 text-sm text-dhundla">
            Already have an account?{" "}
            <Link href="/account/login" className="font-medium text-shahtoot hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </Container>
    </main>
  )
}
