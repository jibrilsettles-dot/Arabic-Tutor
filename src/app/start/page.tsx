import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

/** Entry point of the installed app (the manifest's start_url). */
export default async function Start() {
  const current = await getCurrentUser();
  if (!current) redirect("/signup");
  if (!current.profile.onboarded) redirect("/onboarding");
  redirect("/chat");
}
