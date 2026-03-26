import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { SignUpForm } from "@/components/auth/sign-up-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { auth } from "@/lib/auth"

export default async function RegisterPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="px-8 pb-2 pt-8 text-center">
          <CardTitle>Join the Agency</CardTitle>
          <CardDescription>Create your detective profile and start solving cases.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center p-8 pt-0">
          <SignUpForm />
        </CardContent>
      </Card>
    </div>
  )
}
