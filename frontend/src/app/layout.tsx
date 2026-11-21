import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { UserProvider } from "@/context/UserContext";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Master Truth Vault Studio | Resumme Builder",
  description: "Zero-hallucination ATS Resume Builder - Master Truth Vault & Alignment Studio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${jetBrainsMono.variable}`}>
      <body className="bg-slate-50 text-slate-900 min-h-screen antialiased selection:bg-emerald-100 selection:text-emerald-900 font-sans">
        <UserProvider>
          <div className="flex min-h-screen">
            {/* Fixed 240px Sidebar */}
            <Sidebar />

            {/* Main scrollable viewport */}
            <main className="flex-1 ml-[240px] min-h-screen flex flex-col bg-dot-grid">
              {children}
            </main>
          </div>
        </UserProvider>
      </body>
    </html>
  );
}
