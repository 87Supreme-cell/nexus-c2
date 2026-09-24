import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NEXUS-C2 // Tactical Command Deck",
  description: "DoD-Grade Google Workspace & AI Orchestration Command Center",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-c2-bg antialiased selection:bg-c2-cyan selection:text-c2-bg">
        {children}
      </body>
    </html>
  );
}
