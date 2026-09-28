import { InstallGuard } from "@/components/InstallGuard";
import { Logo } from "@/components/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <InstallGuard>
      <div className="pt-safe pb-safe relative min-h-dvh overflow-hidden">
        <div className="pattern-overlay" />
        <div className="pointer-events-none absolute -top-48 left-1/2 h-96 w-[40rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <main className="relative mx-auto flex min-h-dvh max-w-sm flex-col px-5 py-10">
          <div className="my-auto">
            <div className="animate-rise mb-8 flex flex-col items-center text-center">
              <Logo size={64} className="drop-shadow-lg" />
            </div>
            {children}
          </div>
        </main>
      </div>
    </InstallGuard>
  );
}
