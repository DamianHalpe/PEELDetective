import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Users, GraduationCap } from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/lib/auth";

export const metadata = { title: "Admin Dashboard" };

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  if ((session.user.role as string) !== "admin") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-gradient-to-b from-detective-slate/10 to-background">
      <div className="container mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your PEEL Detective platform</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/admin/users">
            <Card className="border-detective-amber/20 hover:border-detective-amber/60 transition-colors cursor-pointer">
              <CardHeader>
                <div className="rounded-lg bg-detective-amber/10 p-2 w-fit mb-2">
                  <Users className="h-5 w-5 text-detective-amber" />
                </div>
                <CardTitle className="text-lg">User Management</CardTitle>
                <CardDescription>Manage teachers and student accounts</CardDescription>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/admin/teachers">
            <Card className="border-detective-amber/20 hover:border-detective-amber/60 transition-colors cursor-pointer">
              <CardHeader>
                <div className="rounded-lg bg-detective-amber/10 p-2 w-fit mb-2">
                  <Users className="h-5 w-5 text-detective-amber" />
                </div>
                <CardTitle className="text-lg">Teachers</CardTitle>
                <CardDescription>Create and manage teacher accounts</CardDescription>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/admin/students">
            <Card className="border-detective-amber/20 hover:border-detective-amber/60 transition-colors cursor-pointer">
              <CardHeader>
                <div className="rounded-lg bg-detective-amber/10 p-2 w-fit mb-2">
                  <GraduationCap className="h-5 w-5 text-detective-amber" />
                </div>
                <CardTitle className="text-lg">Students</CardTitle>
                <CardDescription>Search, edit, and manage student accounts</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
