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
  if ((session.user.role as string) !== "super-admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, email, password } = body as Record<string, unknown>;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return Response.json({ error: "Full name is required" }, { status: 400 });
  }
  if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return Response.json({ error: "Valid email is required" }, { status: 400 });
  }
  if (!password || typeof password !== "string" || password.length < 8) {
    return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });
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

  // Set role to admin and verify email
  await db
    .update(user)
    .set({ role: "admin", emailVerified: true })
    .where(eq(user.id, newUser.user.id));

  return Response.json(
    { id: newUser.user.id, name: name.trim(), email: email.trim() },
    { status: 201 }
  );
}
