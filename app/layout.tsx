import type { Metadata } from "next";
import { ContextProvider } from "./components/Layout/context/ContextProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Postmen - Modern API Testing Platform",
  description:
    "A beautiful, fast, and intuitive API testing tool for modern developers. Test, debug, and optimize your APIs with ease.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style>{`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(24px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes slideInLeft {
            from { opacity: 0; transform: translateX(-32px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes slideInRight {
            from { opacity: 0; transform: translateX(32px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes glow {
            0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
            50% { box-shadow: 0 0 0 10px rgba(99, 102, 241, 0); }
          }
          @keyframes shimmer {
            0% { background-position: -1000px 0; }
            100% { background-position: 1000px 0; }
          }
          .animate-fadeInUp { animation: fadeInUp 0.7s ease-out forwards; }
          .animate-slideInLeft { animation: slideInLeft 0.7s ease-out forwards; }
          .animate-slideInRight { animation: slideInRight 0.7s ease-out forwards; }
          .animate-glow { animation: glow 2s infinite; }
        `}</style>
      </head>
      <body className="bg-linear-to-br from-white via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 transition-colors duration-300">
        <ContextProvider>{children}</ContextProvider>
      </body>
    </html>
  );
}
