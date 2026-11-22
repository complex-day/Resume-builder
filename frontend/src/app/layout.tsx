import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { UserProvider } from "@/context/UserContext";
import { ThemeProvider } from "@/context/ThemeContext";

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
    <html lang="en" className={`${plusJakarta.variable} ${jetBrainsMono.variable}`} suppressHydrationWarning>
      <body className="bg-slate-50 dark:bg-[#09090B] text-slate-900 dark:text-zinc-100 min-h-screen antialiased selection:bg-emerald-100 dark:selection:bg-emerald-950 selection:text-emerald-900 dark:selection:text-emerald-200 font-sans transition-colors duration-150">
        <ThemeProvider>
          <UserProvider>
            <div className="flex min-h-screen">
              {/* Fixed 240px Sidebar */}
              <Sidebar />

              {/* Main scrollable viewport */}
              <main className="flex-1 ml-[240px] min-h-screen flex flex-col bg-dot-grid dark:bg-[#09090B] dark:text-zinc-100">
                {children}
              </main>
            </div>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
