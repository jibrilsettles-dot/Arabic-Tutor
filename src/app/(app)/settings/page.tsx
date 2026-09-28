import { requireLearner } from "@/lib/auth";
import { logout } from "@/app/actions";
import { Logo } from "@/components/Logo";
import { LogoutIcon } from "@/components/icons";
import { AddressSetting, NotificationSettings } from "./SettingsControls";

export default async function SettingsPage() {
  const { user, profile } = await requireLearner();

  return (
    <div className="h-full overflow-y-auto">
      <div className="pt-safe mx-auto max-w-2xl px-4 pb-10">
        <header className="pt-6">
          <p lang="ar" className="ar text-xl text-primary">
            الْإِعْدَادَاتُ
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Settings</h1>
        </header>

        <section className="mt-6 flex items-center gap-4 rounded-3xl border border-line bg-surface p-4 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft font-display text-xl font-semibold text-primary">
            {user.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{user.name}</p>
            <p className="truncate text-sm text-muted">{user.email}</p>
          </div>
        </section>

        <h2 className="mt-8 px-1 text-sm font-semibold text-muted">Daily practice texts</h2>
        <NotificationSettings notifyHour={profile.notifyHour} notifyEnabled={profile.notifyEnabled} />

        <h2 className="mt-8 px-1 text-sm font-semibold text-muted">How your tutor addresses you</h2>
        <AddressSetting addressAs={profile.addressAs} />

        <form action={logout} className="mt-8">
          <button className="flex w-full items-center justify-center gap-2 rounded-2xl border border-line bg-surface px-5 py-3.5 font-semibold text-danger transition hover:bg-danger-soft">
            <LogoutIcon size={18} /> Sign out
          </button>
        </form>

        <footer className="mt-10 flex flex-col items-center gap-2 text-center text-xs text-muted">
          <Logo size={28} />
          <p>Muʿallim · Fuṣḥā & Qur&apos;anic Arabic tutor</p>
          <p className="max-w-xs">
            Guided by the Qur&apos;an, Hans Wehr, Al-ʿArabiyyah Bayna Yadayk and the Madinah Arabic Course. AI can make mistakes. Verify Qur&apos;anic quotations with a muṣḥaf.
          </p>
        </footer>
      </div>
    </div>
  );
}
