import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { sql, and, type SQL } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

export async function GET(req: NextRequest) {
  const nickname = req.nextUrl.searchParams.get("nickname")?.trim();
  if (!nickname) {
    return NextResponse.json({ available: true });
  }

  // Optional session — used to exclude the current user when editing their own nickname
  const session = await auth.api.getSession({ headers: await headers() });

  const conditions: SQL[] = [
    sql`lower(${schema.user.nickname}) = lower(${nickname})`,
  ];
  if (session) {
    conditions.push(sql`${schema.user.id} != ${session.user.id}`);
  }

  const [existing] = await db
    .select({ id: schema.user.id })
    .from(schema.user)
    .where(and(...conditions))
    .limit(1);

  return NextResponse.json({ available: !existing });
}
