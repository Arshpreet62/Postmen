"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGlobal } from "./context/Context";
import { RxRocket, RxCheckCircled } from "react-icons/rx";
import { FaLightbulb, FaLock } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const Landing: React.FC = () => {
  const { isAuthenticated, user } = useGlobal();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && user) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,224,255,0.18),transparent_60%)]" />
      <div className="absolute -top-24 right-0 h-64 w-120 rounded-full bg-[radial-gradient(circle,rgba(0,255,170,0.25),transparent_60%)] blur-3xl" />

      <nav className=" sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="text-sm font-semibold uppercase tracking-[0.4em]">
            Postmen
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button asChild size="sm" variant="outline">
              <Link href="/login">Login</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="bg-primary text-primary-foreground"
            >
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 pb-20 pt-20 lg:grid-cols-2 lg:items-center">
        <div className="space-y-8">
          <div className="space-y-3">
            <span className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
              Control Room
            </span>
            <h1 className="text-5xl font-semibold leading-tight lg:text-6xl">
              Industrial-grade API testing for modern teams.
            </h1>
            <p className="text-lg text-muted-foreground">
              Postmen keeps your API fleet observable, auditable, and fast.
              Launch tests, inspect responses, and ship with confidence.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/signup">
                <RxRocket className="mr-2" size={18} /> Launch workspace
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="#features">See capabilities</Link>
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Operators", value: "100+" },
              { label: "Runs / month", value: "10k" },
              { label: "Uptime", value: "99.9%" },
            ].map((stat) => (
              <Card key={stat.label} className="border-border/60 bg-card/80">
                <CardContent className="space-y-1 p-4">
                  <div className="text-2xl font-semibold">{stat.value}</div>
                  <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {stat.label}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="relative hidden lg:block">
          <div className="absolute inset-0 rounded-3xl bg-[linear-gradient(140deg,rgba(15,23,42,0.12),transparent)]" />
          <Card className="relative border-border/60 bg-card/90 p-6 shadow-xl">
            <CardHeader className="space-y-2 p-0">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-muted-foreground">
                <span>Live request</span>
                <span>api.fabric.local</span>
              </div>
              <CardTitle className="text-xl">GET /v1/metrics</CardTitle>
              <CardDescription>
                Monitor performance signals in real time.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-6 space-y-4 p-0 font-mono text-sm">
              <div className="rounded-lg border border-border/60 bg-muted/40 p-4">
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <span className="text-emerald-600">200 OK</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                  <div>
                    <div>Latency</div>
                    <div className="text-foreground">124ms</div>
                  </div>
                  <div>
                    <div>Payload</div>
                    <div className="text-foreground">4.2KB</div>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-accent/40 bg-accent/10 p-4 text-sm">
                ✓ All checks passed. Fleet stable.
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-6 pb-20">
        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              title: "Lightning fast",
              description:
                "Sub-100ms response analysis with immediate diffing and replay.",
              icon: <FaLightbulb size={22} />,
            },
            {
              title: "Secure by default",
              description:
                "Encrypted traffic snapshots with zero response persistence.",
              icon: <FaLock size={22} />,
            },
            {
              title: "History & stats",
              description:
                "Track runs, compare results, and export performance reports.",
              icon: <RxCheckCircled size={22} />,
            },
          ].map((feature) => (
            <Card key={feature.title} className="border-border/60 bg-card/80">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border/60 bg-muted/40 text-accent">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t border-border/60 bg-muted/40 py-16">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 text-center">
          <h2 className="text-3xl font-semibold">
            Run every endpoint with industrial precision.
          </h2>
          <p className="text-muted-foreground">
            Join the operators keeping production APIs calm, fast, and reliable.
          </p>
          <Button asChild>
            <Link href="/signup">Start your workspace</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border/60 py-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 text-sm text-muted-foreground">
          <span>© 2026 Postmen. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <Link href="/about">About</Link>
            <a href="#">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
