"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, profiles, skills, users } from "@/lib/db";
import { endSession, getUserId, startSession } from "@/lib/auth";
import { ABY_STARTS, MADINAH_STARTS, topicsBefore } from "@/lib/tutor/curriculum";

export interface FormState {
  error?: string;
  fields?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

const SignupSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(60),
  email: z.string().trim().toLowerCase().email("That email doesn't look right."),
  password: z.string().min(8, "Use at least 8 characters for your password.").max(200),
});

export async function signup(_: FormState, formData: FormData): Promise<FormState> {
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const parsed = SignupSchema.safeParse(raw);
  const fields = { name: raw.name ?? "", email: raw.email ?? "" };
  if (!parsed.success) return { error: parsed.error.issues[0].message, fields };

  const { name, email, password } = parsed.data;
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (existing.length) {
    return { error: "An account with this email already exists. Try signing in.", fields };
  }

  const id = crypto.randomUUID();
  await db.insert(users).values({ id, name, email, passwordHash: await bcrypt.hash(password, 10) });
  await db.insert(profiles).values({ userId: id });
  await startSession(id);
  redirect("/onboarding");
}

const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, "Enter your email."),
  password: z.string().min(1, "Enter your password."),
});

export async function login(_: FormState, formData: FormData): Promise<FormState> {
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const parsed = LoginSchema.safeParse(raw);
  const fields = { email: raw.email ?? "" };
  if (!parsed.success) return { error: parsed.error.issues[0].message, fields };

  const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email));
  const ok = user && (await bcrypt.compare(parsed.data.password, user.passwordHash));
  if (!ok) return { error: "Email or password is incorrect.", fields };

  await startSession(user.id);
  redirect("/start");
}

export async function logout() {
  await endSession();
  redirect("/login");
}

// ---------------------------------------------------------------------------
// Onboarding: seeds the learner memory
// ---------------------------------------------------------------------------

const OnboardingSchema = z.object({
  addressAs: z.enum(["m", "f"]),
  madinahStart: z.enum(MADINAH_STARTS.map((m) => m.value) as [string, ...string[]]),
  abyStart: z.enum(ABY_STARTS.map((a) => a.value) as [string, ...string[]]),
  goals: z.string().max(500).default(""),
  timezone: z.string().max(80).default("UTC"),
});

export async function completeOnboarding(input: z.input<typeof OnboardingSchema>) {
  const userId = await getUserId();
  if (!userId) redirect("/login");
  const data = OnboardingSchema.parse(input);

  const now = new Date();
  await db
    .update(profiles)
    .set({
      onboarded: true,
      addressAs: data.addressAs as "m" | "f",
      madinahStart: data.madinahStart,
      abyStart: data.abyStart,
      goals: data.goals,
      timezone: safeTimezone(data.timezone),
      updatedAt: now,
    })
    .where(eq(profiles.userId, userId));

  // Treat earlier books as covered until the tutor sees otherwise.
  for (const topic of topicsBefore(data.madinahStart)) {
    await db
      .insert(skills)
      .values({ userId, topicId: topic.id, status: "solid", note: "self-reported at signup", updatedAt: now })
      .onConflictDoNothing();
  }
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export async function updateNotificationSettings(input: { notifyHour?: number; notifyEnabled?: boolean; timezone?: string }) {
  const userId = await getUserId();
  if (!userId) redirect("/login");
  const set: Partial<typeof profiles.$inferInsert> = {};
  if (typeof input.notifyHour === "number" && input.notifyHour >= 0 && input.notifyHour <= 23) {
    set.notifyHour = Math.floor(input.notifyHour);
  }
  if (typeof input.notifyEnabled === "boolean") set.notifyEnabled = input.notifyEnabled;
  if (input.timezone) set.timezone = safeTimezone(input.timezone);
  if (Object.keys(set).length) {
    await db.update(profiles).set(set).where(eq(profiles.userId, userId));
  }
}

export async function updateAddressAs(addressAs: "m" | "f") {
  const userId = await getUserId();
  if (!userId) redirect("/login");
  if (addressAs !== "m" && addressAs !== "f") return;
  await db.update(profiles).set({ addressAs }).where(eq(profiles.userId, userId));
}

function safeTimezone(tz: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return tz;
  } catch {
    return "UTC";
  }
}
