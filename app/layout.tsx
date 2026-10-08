import type { Metadata } from "next";
import { Providers } from "./components/Layout/context/Providers";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Postmen: send a request, get a postmark",
    template: "%s | Postmen",
  },
  description:
    "Send an HTTP request from your browser and get the response back with a postmark: status, round-trip time and size. Sign in to keep an outbox.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Postmen: send a request, get a postmark",
    description:
      "Send an HTTP request from your browser and get the response back with a postmark: status, round-trip time and size. Sign in to keep an outbox.",
    url: "/",
    siteName: "Postmen",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Postmen: send a request, get a postmark",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Postmen: send a request, get a postmark",
    description:
      "Send an HTTP request from your browser and get the response back with a postmark: status, round-trip time and size. Sign in to keep an outbox.",
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
                document.documentElement.setAttribute('data-js', '');
                var stored = null;
                try { stored = localStorage.getItem('postmen-theme'); } catch (e) {}
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const theme = stored || (prefersDark ? 'dark' : 'light');
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Recursive:slnt,wght,CASL,MONO@-15..0,300..1000,0..1,0..1&family=Big+Shoulders+Stencil:wght@900&display=swap"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
