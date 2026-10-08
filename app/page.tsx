import type { Metadata } from "next";
import Landing from "./components/Layout/Landing";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Send an HTTP request and read the response, headers and round-trip time. Sign in to keep an outbox of every request.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return <Landing />;
}
