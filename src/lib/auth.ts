import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, profiles, users } from "@/lib/db";
import {
  SESSION_COOKIE,
  SESSION_DAYS,
  signSession,
  verifySession,
} from "@/lib/session";

export async function startSession(userId: string) {
  const token = await signSession(userId);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export const getUserId = cache(async () => {
  return verifySession((await cookies()).get(SESSION_COOKIE)?.value);
});

export const getCurrentUser = cache(async () => {
  const userId = await getUserId();
  if (!userId) return null;
  const rows = await db
    .select({ user: users, profile: profiles })
    .from(users)
    .innerJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(users.id, userId))
    .limit(1);
  return rows[0] ?? null;
});

/** For pages: returns the signed-in, onboarded learner or redirects. */
export async function requireLearner() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  if (!current.profile.onboarded) redirect("/onboarding");
  return current;
}
