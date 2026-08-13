import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TelemetryProvider } from "@/contexts/TelemetryContext";
import { Header } from "@/components/Header";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Textile Telemetry Dashboard",
  description: "Monitor and manage textile looms in real-time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <TelemetryProvider>
          <div className="min-h-screen bg-[#e8ebf0] text-[#1e293b] font-sans flex flex-col">
            <Header />
            <main className="flex-1 overflow-hidden">
              <Toaster position="top-right" reverseOrder={false} />
              {children}
            </main>
          </div>
        </TelemetryProvider>
      </body>
    </html>
  );
}
