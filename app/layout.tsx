import type { Metadata } from "next";
import Script from "next/script";
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
    icon: "/icons/icon-192.png",
    shortcut: "/icons/favicon.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {process.env.NODE_ENV !== "production" ? (
          <Script id="ember-dev-sw-reset" strategy="beforeInteractive">
            {`
              (function () {
                if (!("serviceWorker" in navigator)) return;
                if (!location.hostname.includes("localhost") && location.hostname !== "127.0.0.1") return;
                if (sessionStorage.getItem("ember-dev-sw-reset") === "done") return;

                navigator.serviceWorker.getRegistrations().then(function (registrations) {
                  if (!registrations.length) return;

                  Promise.all(registrations.map(function (registration) {
                    return registration.unregister();
                  })).then(function () {
                    sessionStorage.setItem("ember-dev-sw-reset", "done");
                    location.reload();
                  });
                });
              })();
            `}
          </Script>
        ) : null}
        {children}
      </body>
    </html>
  );
}
