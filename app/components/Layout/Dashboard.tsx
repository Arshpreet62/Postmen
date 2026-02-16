"use client";

import React, { useState } from "react";
import { useGlobal } from "./context/Context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import RequestForm from "../UI/Form";
import RequestHistory from "../UI/RequestHistory";
import Statistics from "../UI/Statics";
import ResponseShowcase from "../UI/ResponseDisplay";
import {
  FaSignOutAlt,
  FaFileAlt,
  FaChartBar,
  FaPaperPlane,
} from "react-icons/fa";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";

const Dashboard: React.FC = () => {
  const { user, logout, responseData } = useGlobal();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"request" | "history" | "stats">(
    "request",
  );

  const handleLogout = async () => {
    try {
      logout();
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
      router.push("/");
    }
  };

  const tabs = [
    { id: "request", label: "Make Request", icon: FaPaperPlane },
    { id: "history", label: "History", icon: FaFileAlt },
    { id: "stats", label: "Statistics", icon: FaChartBar },
  ] as const;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo & Brand */}
            <Link href="/" className="flex items-center gap-3">
              <div className="text-sm font-semibold uppercase tracking-[0.4em] text-primary">
                Postmen
              </div>
            </Link>

            {/* User Info */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end">
                <p className="text-base font-bold text-foreground">
                  {user?.email || "User"}
                </p>
                <p className="text-sm font-medium text-muted-foreground">
                  Connected
                </p>
              </div>

              <ThemeToggle />

              {/* Logout Button */}
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                <FaSignOutAlt size={16} />
                <span className="hidden sm:inline ml-2">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="sticky h-15 top-16 z-30 border-b border-border bg-background/70 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2  hide-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-6  font-bold text-base flex items-center gap-2 whitespace-nowrap rounded-b-xl transition-all duration-300 ${
                    activeTab === tab.id
                      ? "text-white dark:text-emerald-800 bg-emerald-800 dark:bg-white "
                      : "text-muted-foreground bg-muted/40 hover:bg-muted/60 hover:text-foreground"
                  }`}
                >
                  <Icon size={20} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-fadeInUp">
          {activeTab === "request" && (
            <div className="space-y-6">
              {/* Request Form Card */}
              <div className="rounded-2xl border border-border/60 bg-card/80 p-8 shadow-lg backdrop-blur">
                <h2 className="mb-6 flex items-center gap-3 text-3xl font-extrabold text-foreground">
                  <FaPaperPlane className="text-accent" size={24} />
                  Create API Request
                </h2>
                <RequestForm />
              </div>

              {/* Response Display Card */}
              {responseData && (
                <div className="rounded-2xl border border-border/60 bg-card/80 p-8 shadow-lg backdrop-blur">
                  <h2 className="mb-6 text-3xl font-extrabold text-foreground">
                    Response
                  </h2>
                  <ResponseShowcase
                    request={responseData.request}
                    response={responseData.response}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === "history" && (
            <div className="rounded-2xl border border-border/60 bg-card/80 p-8 shadow-lg backdrop-blur">
              <h2 className="mb-6 flex items-center gap-3 text-3xl font-extrabold text-foreground">
                <FaFileAlt className="text-accent" size={24} />
                Request History
              </h2>
              <RequestHistory />
            </div>
          )}

          {activeTab === "stats" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-border/60 bg-card/80 p-8 shadow-lg backdrop-blur">
                <h2 className="mb-6 flex items-center gap-3 text-3xl font-extrabold text-foreground">
                  <FaChartBar className="text-accent" size={24} />
                  Statistics & Analytics
                </h2>
                <Statistics />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-border/60 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center text-base font-medium text-muted-foreground">
          © 2026 Postmen. Built with ⚡ for API developers.
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
