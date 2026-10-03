import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "Fitmax 0.0.1",
  description: "Offline-first fitness companion: steps, workouts, manual food log and streaks.",
};

export const viewport: Viewport = {
  themeColor: "#0b1220",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <AppProvider>
          <div className="mx-auto max-w-3xl px-4 pb-24 pt-6">{children}</div>
          <BottomNav />
        </AppProvider>
      </body>
    </html>
  );
}
