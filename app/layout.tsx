import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { CommandMenu } from "@/components/shared/command-menu";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Storporate — Academic-Industry Collaboration for Bangladesh",
  description:
    "Storporate bridges the academic-industry gap in Bangladesh with AI-driven matching for students, university clubs, and companies — powering hiring, sponsorships, and strategic collaborations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <CommandMenu />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
