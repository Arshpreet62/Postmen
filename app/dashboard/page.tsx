import type { Metadata } from "next";
import Dashboard from "../components/Layout/Dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage and test your API requests in the Postmen dashboard.",
  alternates: { canonical: "/dashboard" },
};

export default function DashboardPage() {
  return <Dashboard />;
}
