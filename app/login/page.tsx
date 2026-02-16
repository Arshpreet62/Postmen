import type { Metadata } from "next";
import Login from "../components/Layout/Login";

export const metadata: Metadata = {
  title: "Login",
  description: "Log in to Postmen to access your API testing dashboard.",
  alternates: { canonical: "/login" },
};

export default function LoginPage() {
  return <Login />;
}
