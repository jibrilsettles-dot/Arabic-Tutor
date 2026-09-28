import { InstallGuard } from "@/components/InstallGuard";
import { TabBar } from "./TabBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <InstallGuard>
      <div className="flex h-dvh flex-col overflow-hidden">
        <div className="min-h-0 flex-1">{children}</div>
        <TabBar />
      </div>
    </InstallGuard>
  );
}
