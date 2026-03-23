import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [found] = await db
    .select()
    .from(schema.scenario)
    .where(eq(schema.scenario.id, id));

  if (!found) {
    return Response.json({ error: "Scenario not found" }, { status: 404 });
  }

  return Response.json(found);
}

export async function PUT(req: Request, { params }: RouteParams) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role as string;
  if (role !== "teacher" && role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data = body as {
    title?: string;
    crimeDescription?: string;
    suspects?: { name: string; background: string; imageUrl?: string }[];
    clues?: string[];
    correctCulprit?: string;
    difficulty?: number;
    published?: boolean;
  };

  // Build the update object with only provided fields
  const updateFields: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (data.title !== undefined) updateFields.title = data.title;
  if (data.crimeDescription !== undefined)
    updateFields.crimeDescription = data.crimeDescription;
  if (data.suspects !== undefined) updateFields.suspects = data.suspects;
  if (data.clues !== undefined) updateFields.clues = data.clues;
  if (data.correctCulprit !== undefined)
    updateFields.correctCulprit = data.correctCulprit;
  if (data.difficulty !== undefined) {
    if (data.difficulty < 1 || data.difficulty > 3) {
      return Response.json(
        { error: "Difficulty must be 1, 2, or 3" },
        { status: 400 }
      );
    }
    updateFields.difficulty = data.difficulty;
  }
  if (data.published !== undefined) updateFields.published = data.published;

  const [updated] = await db
    .update(schema.scenario)
    .set(updateFields)
    .where(eq(schema.scenario.id, id))
    .returning();

  if (!updated) {
    return Response.json({ error: "Scenario not found" }, { status: 404 });
  }

  return Response.json(updated);
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role as string;
  if (role !== "teacher" && role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const [deleted] = await db
    .delete(schema.scenario)
    .where(eq(schema.scenario.id, id))
    .returning();

  if (!deleted) {
    return Response.json({ error: "Scenario not found" }, { status: 404 });
  }

  return Response.json({ success: true });
}
