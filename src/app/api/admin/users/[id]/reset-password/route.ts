import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/schema";
import { isAdminOrSuperAdmin } from "@/lib/session";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminOrSuperAdmin(session.user.role as string)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const [targetUser] = await db
    .select({ email: user.email })
    .from(user)
    .where(eq(user.id, id))
    .limit(1);

  if (!targetUser) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  try {
    await auth.api.requestPasswordReset({
      body: {
        email: targetUser.email,
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
      },
    });
  } catch {
    // If email delivery is not configured the reset link is logged to console (see auth.ts)
  }

  return Response.json({ success: true });
}
