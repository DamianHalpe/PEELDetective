import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { inArray } from "drizzle-orm";
import { ArrowLeft, ShieldCheck } from "lucide-react";
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
import { isAdminOrSuperAdmin } from "@/lib/session";
import { AdminUserActions } from "../_components/AdminUserActions";
import { AddAdminDialog } from "./_components/AddAdminDialog";

export const metadata = { title: "Manage Admins — Admin" };

export default async function AdminAdminsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const viewerRole = session.user.role as string;
  if (!isAdminOrSuperAdmin(viewerRole)) redirect("/dashboard");

  const admins = await db
    .select({
      id: schema.user.id,
      name: schema.user.name,
      email: schema.user.email,
      role: schema.user.role,
      banned: schema.user.banned,
      createdAt: schema.user.createdAt,
    })
    .from(schema.user)
    .where(inArray(schema.user.role, ["admin", "super-admin"]))
    .orderBy(schema.user.name);

  return (
    <div className="min-h-screen bg-gradient-to-b from-detective-slate/10 to-background">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/users">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Manage Admins</h1>
              <p className="text-muted-foreground mt-1">
                Create and manage administrator accounts
              </p>
            </div>
          </div>
          {viewerRole === "super-admin" && <AddAdminDialog />}
        </div>

        {/* Admin table */}
        <Card className="border-detective-amber/20">
          <CardHeader>
            <CardTitle>Administrators</CardTitle>
            <CardDescription>
              {admins.length} admin{admins.length !== 1 ? "s" : ""}
              {viewerRole !== "super-admin" && " — view only"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {admins.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShieldCheck className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>No admins yet.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Joined</TableHead>
                    {viewerRole === "super-admin" && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">{admin.name}</TableCell>
                      <TableCell className="text-muted-foreground">{admin.email}</TableCell>
                      <TableCell>
                        {admin.role === "super-admin" ? (
                          <Badge className="bg-detective-amber/20 text-detective-amber border-detective-amber/40">
                            Super Admin
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Admin</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">
                        {new Date(admin.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                      {viewerRole === "super-admin" && (
                        <TableCell className="text-right">
                          {admin.role === "super-admin" ? (
                            <span className="text-xs text-muted-foreground">—</span>
                          ) : (
                            <AdminUserActions
                              userId={admin.id}
                              userName={admin.name}
                              userRole={admin.role}
                              isBanned={admin.banned}
                              viewerRole="super-admin"
                            />
                          )}
                        </TableCell>
                      )}
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
