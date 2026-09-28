import type { Metadata } from "next";
import { InstallScreen } from "./InstallScreen";

export const metadata: Metadata = {
  title: "Install Muʿallim — Your Arabic Tutor",
};

export default function Home() {
  return <InstallScreen />;
}
