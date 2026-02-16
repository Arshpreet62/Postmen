import type { Metadata } from "next";
import { Providers } from "./components/Layout/context/Providers";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Postmen - Modern API Testing Platform",
    template: "%s | Postmen",
  },
  description:
    "A beautiful, fast, and intuitive API testing tool for modern developers. Test, debug, and optimize your APIs with ease.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Postmen - Modern API Testing Platform",
    description:
      "A beautiful, fast, and intuitive API testing tool for modern developers. Test, debug, and optimize your APIs with ease.",
    url: "/",
    siteName: "Postmen",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Postmen - Modern API Testing Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Postmen - Modern API Testing Platform",
    description:
      "A beautiful, fast, and intuitive API testing tool for modern developers.",
    images: ["/opengraph-image"],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const stored = localStorage.getItem('postmen-theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const theme = stored || (prefersDark ? 'dark' : 'light');
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
        <style>{`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(24px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeInUp { animation: fadeInUp 0.7s ease-out forwards; }
        `}</style>
      </head>
      <body className="relative min-h-screen bg-background text-foreground transition-colors duration-300">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
