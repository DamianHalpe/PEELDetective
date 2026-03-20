import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const nickname = typeof body.nickname === "string" ? body.nickname.trim() : undefined;

  if (nickname === undefined) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  if (nickname !== "" && !/^[a-zA-Z0-9_-]{3,30}$/.test(nickname)) {
    return NextResponse.json(
      { error: "Username must be 3–30 characters and contain only letters, numbers, _ or -" },
      { status: 422 }
    );
  }

  if (nickname !== "") {
    const [existing] = await db
      .select({ id: schema.user.id })
      .from(schema.user)
      .where(
        sql`lower(${schema.user.nickname}) = lower(${nickname}) AND ${schema.user.id} != ${session.user.id}`
      )
      .limit(1);

    if (existing) {
      return NextResponse.json({ error: "That username is already taken" }, { status: 409 });
    }
  }

  await db
    .update(schema.user)
    .set({ nickname: nickname === "" ? null : nickname })
    .where(sql`${schema.user.id} = ${session.user.id}`);

  return NextResponse.json({ success: true });
}
