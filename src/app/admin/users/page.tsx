import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, count } from "drizzle-orm";
import { ArrowLeft, Users, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

export const metadata = { title: "User Management — Admin" };

export default async function AdminUsersPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  if ((session.user.role as string) !== "admin") redirect("/dashboard");

  const teacherRows = await db
    .select({ teacherCount: count() })
    .from(schema.user)
    .where(eq(schema.user.role, "teacher"));
  const teacherCount = teacherRows[0]?.teacherCount ?? 0;

  const studentRows = await db
    .select({ studentCount: count() })
    .from(schema.user)
    .where(eq(schema.user.role, "student"));
  const studentCount = studentRows[0]?.studentCount ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-detective-slate/10 to-background">
      <div className="container mx-auto p-6 space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground mt-1">Manage teachers and students on the platform</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
          <Link href="/admin/teachers">
            <Card className="border-detective-amber/20 hover:border-detective-amber/60 transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="rounded-lg bg-detective-amber/10 p-2 w-fit mb-2">
                  <Users className="h-5 w-5 text-detective-amber" />
                </div>
                <CardTitle className="text-lg">Teachers</CardTitle>
                <CardDescription>
                  {teacherCount} teacher{teacherCount !== 1 ? "s" : ""} — create, edit, and manage teacher accounts
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/students">
            <Card className="border-detective-amber/20 hover:border-detective-amber/60 transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="rounded-lg bg-detective-amber/10 p-2 w-fit mb-2">
                  <GraduationCap className="h-5 w-5 text-detective-amber" />
                </div>
                <CardTitle className="text-lg">Students</CardTitle>
                <CardDescription>
                  {studentCount} student{studentCount !== 1 ? "s" : ""} — search, edit, suspend, and delete student accounts
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
