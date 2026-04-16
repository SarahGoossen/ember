import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ember",
  description: "A gentle daily companion for healing, consistency, and calm.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Ember",
  },
  icons: {
    icon: "/icons/ember-icon-square.png",
    shortcut: "/icons/favicon.png",
    apple: "/icons/ember-icon-square.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
