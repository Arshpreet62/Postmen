import type { Metadata } from "next";
import Landing from "./components/Layout/Landing";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Postmen is a modern API testing platform with a fast, beautiful UI for developers.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return <Landing />;
}
