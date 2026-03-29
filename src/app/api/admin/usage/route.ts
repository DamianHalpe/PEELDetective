import { headers } from "next/headers";
import { and, eq, gte, sum } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";
import { isAdminOrSuperAdmin } from "@/lib/session";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminOrSuperAdmin((session.user as { role?: string }).role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const [config] = await db
    .select()
    .from(schema.usageConfig)
    .where(eq(schema.usageConfig.id, "default"));

  const dailyCap = config?.dailyCap ?? 100000;
  const monthlyCap = config?.monthlyCap ?? 2000000;

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getUTCFullYear(), now.getUTCMonth(), 1);

  const [usageDay] = await db
    .select({ total: sum(schema.submission.tokensUsed) })
    .from(schema.submission)
    .where(
      and(
        eq(schema.submission.status, "evaluated"),
        gte(schema.submission.aiEvaluatedAt, startOfDay)
      )
    );

  const [usageMonth] = await db
    .select({ total: sum(schema.submission.tokensUsed) })
    .from(schema.submission)
    .where(
      and(
        eq(schema.submission.status, "evaluated"),
        gte(schema.submission.aiEvaluatedAt, startOfMonth)
      )
    );

  return Response.json({
    dailyCap,
    monthlyCap,
    dailyUsed: Number(usageDay?.total ?? 0),
    monthlyUsed: Number(usageMonth?.total ?? 0),
  });
}

export async function PUT(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as { role?: string }).role !== "super-admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data = body as { dailyCap?: number; monthlyCap?: number };

  if (
    typeof data.dailyCap !== "number" ||
    typeof data.monthlyCap !== "number" ||
    data.dailyCap < 0 ||
    data.monthlyCap < 0
  ) {
    return Response.json(
      { error: "dailyCap and monthlyCap must be non-negative numbers" },
      { status: 400 }
    );
  }

  await db
    .insert(schema.usageConfig)
    .values({
      id: "default",
      dailyCap: data.dailyCap,
      monthlyCap: data.monthlyCap,
      updatedAt: new Date(),
      updatedById: session.user.id,
    })
    .onConflictDoUpdate({
      target: schema.usageConfig.id,
      set: {
        dailyCap: data.dailyCap,
        monthlyCap: data.monthlyCap,
        updatedAt: new Date(),
        updatedById: session.user.id,
      },
    });

  return Response.json({ success: true, dailyCap: data.dailyCap, monthlyCap: data.monthlyCap });
}
