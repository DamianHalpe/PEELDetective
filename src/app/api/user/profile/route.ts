import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

const VALID_THEME_PREFERENCES = ["light", "dark", "system", "custom"] as const;
const HEX_COLOR_RE = /^#[0-9a-fA-F]{3,8}$/;

/**
 * Validate that a customTheme JSON string contains the expected shape:
 * { background: "#...", card: "#...", accent: "#..." }
 */
function validateCustomTheme(raw: string): { valid: true } | { valid: false; reason: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { valid: false, reason: "customTheme must be valid JSON" };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { valid: false, reason: "customTheme must be a JSON object" };
  }

  const obj = parsed as Record<string, unknown>;
  for (const key of ["background", "card", "accent"]) {
    if (typeof obj[key] !== "string" || !HEX_COLOR_RE.test(obj[key] as string)) {
      return { valid: false, reason: `customTheme.${key} must be a hex color string (e.g. #ff0000)` };
    }
  }

  return { valid: true };
}

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const nickname = typeof body.nickname === "string" ? body.nickname.trim() : undefined;
  const themePreference = typeof body.themePreference === "string" ? body.themePreference : undefined;
  const customTheme = body.customTheme !== undefined ? body.customTheme : undefined;

  // Build the set of fields to update
  const updates: Record<string, unknown> = {};

  // --- Nickname validation (unchanged logic) ---
  if (nickname !== undefined) {
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

    updates.nickname = nickname === "" ? null : nickname;
  }

  // --- Theme preference validation ---
  if (themePreference !== undefined) {
    if (!(VALID_THEME_PREFERENCES as readonly string[]).includes(themePreference)) {
      return NextResponse.json(
        { error: `themePreference must be one of: ${VALID_THEME_PREFERENCES.join(", ")}` },
        { status: 422 }
      );
    }
    updates.themePreference = themePreference;
  }

  // --- Custom theme validation ---
  if (customTheme !== undefined) {
    if (customTheme === null) {
      updates.customTheme = null;
    } else if (typeof customTheme === "string") {
      const result = validateCustomTheme(customTheme);
      if (!result.valid) {
        return NextResponse.json({ error: result.reason }, { status: 422 });
      }
      updates.customTheme = customTheme;
    } else {
      return NextResponse.json({ error: "customTheme must be a JSON string or null" }, { status: 422 });
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  await db
    .update(schema.user)
    .set(updates)
    .where(sql`${schema.user.id} = ${session.user.id}`);

  return NextResponse.json({ success: true });
}
