import type { Metadata } from "next";
import Link from "next/link";
import { RxGithubLogo, RxTarget, RxHeart } from "react-icons/rx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about Postmen, a modern API testing tool built by developers for developers.",
  alternates: { canonical: "/about" },
};

export default function About() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link
            href="/"
            className="text-sm font-semibold uppercase tracking-[0.4em] text-primary"
          >
            Postmen
          </Link>
          <Button variant="ghost" asChild>
            <Link href="/">Back Home</Link>
          </Button>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Hero */}
        <div className="text-center mb-20 animate-fadeInUp">
          <h1 className="text-5xl font-bold text-foreground mb-6">
            About{" "}
            <span className="bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
              Postmen
            </span>
          </h1>
          <p className="text-xl text-muted-foreground">
            A modern API testing tool built by developers, for developers.
          </p>
        </div>

        {/* Mission Section */}
        <section className="mb-20">
          <Card className="border-border/60 bg-card/80 backdrop-blur">
            <CardContent className="p-12">
              <div className="flex items-start gap-4">
                <RxTarget className="w-8 h-8 text-primary shrink-0 mt-1" />
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-4">
                    Our Mission
                  </h2>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    We believe that API testing should be simple, beautiful, and
                    efficient. Postmen was created to eliminate the friction in
                    API development. Whether you&apos;re building a
                    microservice, integrating third-party APIs, or debugging a
                    production issue, Postmen provides the tools you need
                    without the bloat.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Why Section */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-foreground mb-12">
            Why Postmen?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: "⚡",
                title: "Lightning Fast",
                desc: "Optimized for speed. Get responses in milliseconds, not seconds.",
              },
              {
                icon: "🎨",
                title: "Beautiful UI",
                desc: "Modern design that feels intuitive and delightful to use every day.",
              },
              {
                icon: "🔒",
                title: "Secure",
                desc: "Your data is private. We use end-to-end encryption and never store responses.",
              },
            ].map((item) => (
              <Card
                key={item.title}
                className="border-border/60 bg-card/80 backdrop-blur hover:border-primary/40 transition-all"
              >
                <CardContent className="p-8 space-y-4">
                  <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-primary-foreground text-xl">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-bold text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Technology Section */}
        <section className="mb-20">
          <Card className="border-border/60 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-3xl">Built With Modern Tech</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  "Next.js",
                  "React 19",
                  "TypeScript",
                  "Tailwind CSS",
                  "MongoDB",
                  "JWT Auth",
                  "Mongoose",
                  "Vercel",
                ].map((tech) => (
                  <div
                    key={tech}
                    className="rounded-lg border border-border bg-muted/60 p-4 text-center font-semibold text-muted-foreground"
                  >
                    {tech}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Love Section */}
        <section className="text-center space-y-8">
          <div className="flex items-center justify-center gap-3 text-2xl text-foreground">
            <span>Made with</span>
            <RxHeart className="w-8 h-8 text-red-500 animate-pulse" />
            <span>by developers</span>
          </div>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Postmen is open-source and community-driven. We&apos;re committed to
            building the best API testing experience possible.
          </p>

          <div className="flex justify-center gap-6">
            <Button asChild size="lg" variant="outline" className="gap-2">
              <a
                href="https://github.com/Arshpreet62/Postmen"
                target="_blank"
                rel="noopener noreferrer"
              >
                <RxGithubLogo size={20} />
                View on GitHub
              </a>
            </Button>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/60 mt-20 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center text-muted-foreground">
          © 2026 Postmen. Built by developers, for developers.
        </div>
      </footer>
    </div>
  );
}
