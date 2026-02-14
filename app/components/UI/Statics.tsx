"use client";

import React, { useState, useEffect } from "react";
import { useGlobal } from "../Layout/context/Context";
import { FaTimes, FaArrowUp, FaArrowDown, FaCheck } from "react-icons/fa";
import { apiUrl } from "../../config/api";

interface Statistics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  successRate: number;
  methodBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>;
}

const AnimatedCounter: React.FC<{
  value: number;
  duration?: number;
}> = ({ value, duration = 1000 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      setCount(Math.floor(progress * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <span>{count}</span>;
};

const Statistics: React.FC = () => {
  const { token } = useGlobal();
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatistics = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(apiUrl("/api/stats"), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        console.error("Failed to fetch statistics");
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-slate-600 dark:text-slate-400">
            Loading statistics...
          </p>
        </div>
      </div>
    );
  }

  if (!stats || stats.totalRequests === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
          No statistics yet
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          Make some API requests to see statistics
        </p>
      </div>
    );
  }

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: "bg-blue-500",
      POST: "bg-green-500",
      PUT: "bg-yellow-500",
      DELETE: "bg-red-500",
      PATCH: "bg-purple-500",
    };
    return colors[method] || "bg-slate-500";
  };

  const getStatusColor = (status: string) => {
    const statusCode = parseInt(status);
    if (statusCode >= 200 && statusCode < 300) return "bg-green-500";
    if (statusCode >= 400 && statusCode < 500) return "bg-yellow-500";
    if (statusCode >= 500) return "bg-red-500";
    return "bg-slate-500";
  };

  const successRateNum = Number(stats.successRate).toFixed(1);
  const successRatePercent = parseFloat(successRateNum);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Request Statistics
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Overview of your API testing metrics
          </p>
        </div>
        <button
          onClick={fetchStatistics}
          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-medium text-sm transition-all transform hover:scale-105"
        >
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Requests Card */}
        <div className="glass rounded-xl p-6 border border-white/20 hover:border-indigo-300/50 hover:shadow-lg transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-indigo-500/20 rounded-lg">
              <span className="text-2xl">📊</span>
            </div>
            <div className="text-indigo-600 dark:text-indigo-400">
              <FaArrowUp size={18} />
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1 font-medium">
            Total Requests
          </p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            <AnimatedCounter value={stats.totalRequests} />
          </p>
        </div>

        {/* Successful Card */}
        <div className="glass rounded-xl p-6 border border-white/20 hover:border-green-300/50 hover:shadow-lg transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <FaCheck className="text-2xl text-green-600" />
            </div>
            <div className="text-green-600 dark:text-green-400">
              <FaArrowUp size={18} />
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1 font-medium">
            Successful
          </p>
          <p className="text-3xl font-bold text-green-600">
            <AnimatedCounter value={stats.successfulRequests} />
          </p>
        </div>

        {/* Failed Card */}
        <div className="glass rounded-xl p-6 border border-white/20 hover:border-red-300/50 hover:shadow-lg transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-red-500/20 rounded-lg">
              <FaTimes className="text-2xl text-red-600" />
            </div>
            <div className="text-red-600 dark:text-red-400">
              <FaArrowDown size={18} />
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1 font-medium">
            Failed
          </p>
          <p className="text-3xl font-bold text-red-600">
            <AnimatedCounter value={stats.failedRequests} />
          </p>
        </div>

        {/* Success Rate Card */}
        <div className="glass rounded-xl p-6 border border-white/20 hover:border-blue-300/50 hover:shadow-lg transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <span className="text-2xl">%</span>
            </div>
            <div
              className={
                successRatePercent >= 80 ? "text-green-600" : "text-yellow-600"
              }
            >
              <FaArrowUp size={18} />
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1 font-medium">
            Success Rate
          </p>
          <p className="text-3xl font-bold text-blue-600">{successRateNum}%</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Methods Breakdown */}
        <div className="glass rounded-xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
            Requests by Method
          </h3>
          <div className="space-y-5">
            {Object.entries(stats.methodBreakdown)
              .sort(([, a], [, b]) => b - a)
              .map(([method, count]) => {
                const percentage = (count / stats.totalRequests) * 100;
                return (
                  <div key={method}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-full ${getMethodColor(
                            method,
                          )}`}
                        ></div>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {method}
                        </span>
                      </div>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${getMethodColor(method)} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Status Codes Breakdown */}
        <div className="glass rounded-xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
            Requests by Status
          </h3>
          <div className="space-y-5">
            {Object.entries(stats.statusBreakdown)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([status, count]) => {
                const percentage = (count / stats.totalRequests) * 100;
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-full ${getStatusColor(
                            status,
                          )}`}
                        ></div>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {status}
                        </span>
                      </div>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${getStatusColor(
                          status,
                        )} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Success Rate Overview */}
      <div className="glass rounded-xl p-8 border border-white/20 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-slate-800/50 dark:to-slate-900/50">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Success Rate Overview
            </h3>
            <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              {successRateNum}%
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {stats.successfulRequests} of {stats.totalRequests} requests were
            successful
          </p>
        </div>

        {/* Animated Progress Bar */}
        <div className="relative w-full h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-4 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-1000 ease-out"
            style={{ width: `${successRatePercent}%` }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 rounded-full animate-pulse"></div>
        </div>

        {/* Status Indicator */}
        <div className="mt-6 flex items-center gap-4 p-4 rounded-lg bg-white/50 dark:bg-slate-800/50">
          <div
            className={`w-4 h-4 rounded-full ${
              successRatePercent >= 80
                ? "bg-green-500 animate-pulse"
                : successRatePercent >= 50
                  ? "bg-yellow-500"
                  : "bg-red-500"
            }`}
          ></div>
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {successRatePercent >= 80
                ? "🎉 Excellent performance"
                : successRatePercent >= 50
                  ? "⚠️ Good performance"
                  : "❌ Needs improvement"}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {successRatePercent >= 80
                ? "Your API requests are performing excellently"
                : successRatePercent >= 50
                  ? "Your API requests are performing reasonably well"
                  : "Consider investigating failed requests"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
