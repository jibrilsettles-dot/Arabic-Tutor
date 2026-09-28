import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { InstallGuard } from "@/components/InstallGuard";
import { Onboarding } from "./Onboarding";

export default async function OnboardingPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  if (current.profile.onboarded) redirect("/chat");
  return (
    <InstallGuard>
      <Onboarding name={current.user.name} />
    </InstallGuard>
  );
}
