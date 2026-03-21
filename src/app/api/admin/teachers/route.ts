import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/schema";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ((session.user.role as string) !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, email, password, nickname } = body as Record<string, unknown>;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return Response.json({ error: "Full name is required" }, { status: 400 });
  }
  if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return Response.json({ error: "Valid email is required" }, { status: 400 });
  }
  if (!password || typeof password !== "string" || password.length < 8) {
    return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }
  if (nickname !== undefined && nickname !== "" && (typeof nickname !== "string" || !/^[a-zA-Z0-9_]+$/.test(nickname as string))) {
    return Response.json({ error: "Nickname may only contain letters, numbers, and underscores" }, { status: 400 });
  }

  const trimmedNickname = nickname && typeof nickname === "string" ? nickname.trim() : null;

  // Check for duplicate nickname
  if (trimmedNickname) {
    const existingNickname = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.nickname, trimmedNickname))
      .limit(1);
    if (existingNickname.length > 0) {
      return Response.json({ error: "Nickname is already taken" }, { status: 409 });
    }
  }

  // Create user via BetterAuth (handles password hashing)
  let newUser: { user?: { id?: string } };
  try {
    newUser = await auth.api.signUpEmail({
      body: {
        email: email.trim(),
        password,
        name: name.trim(),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.toLowerCase().includes("email")) {
      return Response.json({ error: "Email is already registered" }, { status: 409 });
    }
    return Response.json({ error: "Failed to create user" }, { status: 500 });
  }

  if (!newUser?.user?.id) {
    return Response.json({ error: "Failed to create user" }, { status: 500 });
  }

  // Update role to teacher, verify email, set nickname
  await db
    .update(user)
    .set({
      role: "teacher",
      emailVerified: true,
      ...(trimmedNickname ? { nickname: trimmedNickname } : {}),
    })
    .where(eq(user.id, newUser.user.id));

  return Response.json(
    { id: newUser.user.id, name: name.trim(), email: email.trim() },
    { status: 201 }
  );
}
