import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { ServiceWorker } from "@/components/ServiceWorker";
import "./globals.css";

// Self-hosted (from Fontsource, SIL OFL) so builds don't need Google Fonts.
const inter = localFont({
  variable: "--font-inter",
  src: "./fonts/inter-latin-wght-normal.woff2",
  weight: "100 900",
});
const fraunces = localFont({
  variable: "--font-fraunces",
  src: "./fonts/fraunces-latin-wght-normal.woff2",
  weight: "100 900",
});
const amiri = localFont({
  variable: "--font-amiri",
  src: [
    { path: "./fonts/amiri-arabic-400-normal.woff2", weight: "400" },
    { path: "./fonts/amiri-arabic-700-normal.woff2", weight: "700" },
  ],
});

export const metadata: Metadata = {
  title: "Muʿallim — Arabic Tutor",
  description: "Your personal Fuṣḥā and Qur'anic Arabic tutor.",
  applicationName: "Muʿallim",
  appleWebApp: {
    capable: true,
    title: "Muʿallim",
    statusBarStyle: "default",
  },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f1e6" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1412" },
  ],
};

// Chrome/Edge/Android fire `beforeinstallprompt` early, sometimes before React
// hydrates. Capture it immediately so the install button can use it.
const captureInstallPrompt = `
window.addEventListener('beforeinstallprompt', function (e) {
  e.preventDefault();
  window.__installPrompt = e;
  window.dispatchEvent(new Event('installpromptready'));
});
window.addEventListener('appinstalled', function () {
  window.__appInstalled = true;
});`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} ${amiri.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: captureInstallPrompt }} />
      </head>
      <body className="min-h-full font-sans">
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
