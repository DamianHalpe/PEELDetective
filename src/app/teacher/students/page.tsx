import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, count } from "drizzle-orm";
import {
  ArrowLeft,
  CreditCard,
  Users,
  UserCheck,
  UserX,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";
import { StudentRowActions } from "./_components/StudentRowActions";

export const metadata = { title: "Manage Students" };

export default async function ManageStudentsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  const role = session.user.role as string;
  if (role !== "teacher" && role !== "admin" && role !== "super-admin") {
    redirect("/dashboard");
  }

  // Fetch all students with their submission counts
  const students = await db
    .select({
      id: schema.user.id,
      name: schema.user.name,
      email: schema.user.email,
      nickname: schema.user.nickname,
      banned: schema.user.banned,
      subscribed: schema.user.subscribed,
      createdAt: schema.user.createdAt,
      submissionCount: count(schema.submission.id),
    })
    .from(schema.user)
    .leftJoin(schema.submission, eq(schema.submission.studentId, schema.user.id))
    .where(eq(schema.user.role, "student"))
    .groupBy(schema.user.id)
    .orderBy(schema.user.name);

  const totalStudents = students.length;
  const activeStudents = students.filter((s) => !s.banned).length;
  const deactivatedStudents = students.filter((s) => s.banned).length;
  const subscribedStudents = students.filter((s) => s.subscribed).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-detective-slate/10 to-background">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/teacher">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Manage Students
              </h1>
              <p className="text-muted-foreground mt-1">
                View and manage all student accounts
              </p>
            </div>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-detective-amber/35">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-detective-amber/15 p-2">
                  <Users className="h-5 w-5 text-detective-amber" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Students
                  </p>
                  <p className="text-2xl font-bold">{totalStudents}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-detective-amber/35">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-100 dark:bg-green-900/30 p-2">
                  <UserCheck className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Active Students
                  </p>
                  <p className="text-2xl font-bold">{activeStudents}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-detective-amber/35">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-red-100 dark:bg-red-900/30 p-2">
                  <UserX className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Deactivated Students
                  </p>
                  <p className="text-2xl font-bold">{deactivatedStudents}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-detective-amber/35">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/30 p-2">
                  <CreditCard className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Subscribed
                  </p>
                  <p className="text-2xl font-bold">{subscribedStudents}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Students table */}
        <Card className="border-detective-amber/35">
          <CardHeader>
            <CardTitle>All Students</CardTitle>
            <CardDescription>
              {totalStudents} student{totalStudents !== 1 ? "s" : ""} registered
              on the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-3 opacity-60" />
                <p>No students registered yet.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Nickname</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Subscription</TableHead>
                    <TableHead className="text-center">Submissions</TableHead>
                    <TableHead className="text-right">Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <Link
                          href={`/teacher/students/${student.id}`}
                          className="font-medium text-detective-amber hover:underline"
                        >
                          {student.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {student.email}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {student.nickname ?? <span>&mdash;</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        {student.banned ? (
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-300 dark:border-red-700">
                            Deactivated
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-300 dark:border-green-700">
                            Active
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {student.subscribed ? (
                          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700">
                            Subscribed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">
                          {student.submissionCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">
                        {new Date(student.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <StudentRowActions
                          studentId={student.id}
                          studentName={student.name}
                          isBanned={student.banned}
                          isSubscribed={student.subscribed}
                          viewerRole={role}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
