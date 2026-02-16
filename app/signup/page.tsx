import type { Metadata } from "next";
import Signup from "../components/Layout/Signup";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create a Postmen account and start testing APIs in minutes.",
  alternates: { canonical: "/signup" },
};

export default function SignupPage() {
  return <Signup />;
}
