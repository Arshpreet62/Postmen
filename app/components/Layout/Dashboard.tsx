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
    <div className="min-h-screen bg-linear-to-br from-white via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b-2 border-slate-300 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo & Brand */}
            <Link href="/" className="flex items-center gap-3">
              <div className="text-4xl font-extrabold bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                ⚡ Postmen
              </div>
            </Link>

            {/* User Info */}
            <div className="flex items-center gap-6">
              <div className="hidden sm:flex flex-col items-end">
                <p className="text-base font-bold text-slate-900 dark:text-white">
                  {user?.email || "User"}
                </p>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Connected
                </p>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-base font-bold transition-all duration-300 hover:scale-105"
              >
                <FaSignOutAlt size={20} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="sticky top-16 z-30 bg-slate-100 dark:bg-slate-800 border-b-2 border-slate-300 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto hide-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-6 font-bold text-base flex items-center gap-2 whitespace-nowrap transition-all duration-300 relative ${
                    activeTab === tab.id
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  <Icon size={20} />
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-indigo-600 to-purple-600 rounded-t-full"></div>
                  )}
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
              <div className="glass rounded-2xl p-8 shadow-lg border-2 border-slate-300 dark:border-slate-600">
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                  <FaPaperPlane
                    className="text-indigo-600 dark:text-indigo-400"
                    size={24}
                  />
                  Create API Request
                </h2>
                <RequestForm />
              </div>

              {/* Response Display Card */}
              {responseData && (
                <div className="glass rounded-2xl p-8 shadow-lg border-2 border-slate-300 dark:border-slate-600">
                  <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-6">
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
            <div className="glass rounded-2xl p-8 shadow-lg border-2 border-slate-300 dark:border-slate-600">
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                <FaFileAlt
                  className="text-indigo-600 dark:text-indigo-400"
                  size={24}
                />
                Request History
              </h2>
              <RequestHistory />
            </div>
          )}

          {activeTab === "stats" && (
            <div className="space-y-6">
              <div className="glass rounded-2xl p-8 shadow-lg border-2 border-slate-300 dark:border-slate-600">
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                  <FaChartBar
                    className="text-indigo-600 dark:text-indigo-400"
                    size={24}
                  />
                  Statistics & Analytics
                </h2>
                <Statistics />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 px-4 sm:px-6 lg:px-8 mt-16">
        <div className="max-w-7xl mx-auto text-center text-slate-700 dark:text-slate-300 text-base font-medium">
          © 2026 Postmen. Built with ⚡ for API developers.
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
