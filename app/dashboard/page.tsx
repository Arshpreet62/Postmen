import type { Metadata } from "next";
import Dashboard from "../components/Layout/Dashboard";

export const metadata: Metadata = {
  title: "Workbench",
  description: "Build and send API requests, and reopen past ones from your outbox.",
  alternates: { canonical: "/dashboard" },
};

export default function DashboardPage() {
  return <Dashboard />;
}
