import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role as string;
  const isTeacherOrAdmin = role === "teacher" || role === "admin";

  if (isTeacherOrAdmin) {
    const scenarios = await db.select().from(schema.scenario);
    return Response.json(scenarios);
  }

  // Students only see published scenarios, and must not receive the correct culprit
  const scenarios = await db
    .select({
      id: schema.scenario.id,
      title: schema.scenario.title,
      crimeDescription: schema.scenario.crimeDescription,
      suspects: schema.scenario.suspects,
      clues: schema.scenario.clues,
      difficulty: schema.scenario.difficulty,
      createdBy: schema.scenario.createdBy,
      published: schema.scenario.published,
      freeToView: schema.scenario.freeToView,
      createdAt: schema.scenario.createdAt,
      updatedAt: schema.scenario.updatedAt,
    })
    .from(schema.scenario)
    .where(eq(schema.scenario.published, true));

  return Response.json(scenarios);
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role as string;
  if (role !== "teacher" && role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

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
    freeToView?: boolean;
  };

  if (
    !data.title ||
    !data.crimeDescription ||
    !Array.isArray(data.suspects) ||
    data.suspects.length === 0 ||
    !Array.isArray(data.clues) ||
    data.clues.length === 0 ||
    !data.correctCulprit ||
    !data.difficulty
  ) {
    return Response.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  if (data.difficulty < 1 || data.difficulty > 3) {
    return Response.json(
      { error: "Difficulty must be 1, 2, or 3" },
      { status: 400 }
    );
  }

  const id = crypto.randomUUID();
  const now = new Date();

  const [created] = await db
    .insert(schema.scenario)
    .values({
      id,
      title: data.title,
      crimeDescription: data.crimeDescription,
      suspects: data.suspects,
      clues: data.clues,
      correctCulprit: data.correctCulprit,
      difficulty: data.difficulty,
      published: data.published ?? false,
      freeToView: data.freeToView ?? false,
      createdBy: session.user.id,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return Response.json(created, { status: 201 });
}
