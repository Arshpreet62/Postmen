"use client";

import React, { useState, useEffect } from "react";
import { useGlobal } from "../Layout/context/Context";
import ResponseShowcase from "./ResponseDisplay";
import { apiUrl } from "../../config/api";
import {
  FaEye,
  FaTrash,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
} from "react-icons/fa";

interface RequestHistoryItem {
  _id: string;
  user: string;
  endpoint: string;
  method: string;
  timestamp: string;
  request: {
    headers: Record<string, string | string[]>;
    body?: any;
  };
  response: {
    status: number;
    statusText: string;
    headers: Record<string, string | string[]>;
    body?: any;
  };
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalRequests: number;
  limit: number;
}

const normalizeHeaders = (
  headers: Record<string, string | string[]>,
): Record<string, string> => {
  const normalized: Record<string, string> = {};
  Object.entries(headers).forEach(([key, value]) => {
    normalized[key] = Array.isArray(value) ? value.join(", ") : value;
  });
  return normalized;
};

const RequestHistory: React.FC = () => {
  const { token } = useGlobal();
  const [history, setHistory] = useState<RequestHistoryItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRequest, setSelectedRequest] =
    useState<RequestHistoryItem | null>(null);

  const fetchHistory = async (page: number = 1) => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(
        apiUrl(`/api/history?page=${page}&limit=6`),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setHistory(data.history);
        setPagination(data.pagination);
      } else {
        console.error("Failed to fetch history");
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteRequest = async (requestId: string) => {
    if (!confirm("Delete this request from history?")) return;
    if (!token) return;
    try {
      const response = await fetch(apiUrl(`/api/history/${requestId}`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        fetchHistory(currentPage);
        setSelectedRequest(null);
      } else {
        console.error("Failed to delete request");
      }
    } catch (error) {
      console.error("Error deleting request:", error);
    }
  };

  const clearAllHistory = async () => {
    if (!token) return;
    if (!confirm("Are you sure you want to clear all request history?")) return;

    try {
      const response = await fetch(apiUrl("/api/history"), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        setHistory([]);
        setPagination(null);
        setSelectedRequest(null);
      } else {
        console.error("Failed to clear history");
      }
    } catch (error) {
      console.error("Error clearing history:", error);
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300)
      return "bg-green-500/10 text-green-600 border-green-200 dark:border-green-800";
    if (status >= 400 && status < 500)
      return "bg-yellow-500/10 text-yellow-600 border-yellow-200 dark:border-yellow-800";
    if (status >= 500)
      return "bg-red-500/10 text-red-600 border-red-200 dark:border-red-800";
    return "bg-slate-500/10 text-slate-600";
  };

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800",
      POST: "bg-green-500/10 text-green-600 border-green-200 dark:border-green-800",
      PUT: "bg-yellow-500/10 text-yellow-600 border-yellow-200 dark:border-yellow-800",
      DELETE: "bg-red-500/10 text-red-600 border-red-200 dark:border-red-800",
      PATCH:
        "bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-800",
    };
    return colors[method] || "bg-slate-500/10 text-slate-600";
  };

  useEffect(() => {
    fetchHistory(currentPage);
  }, [currentPage, token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-indigo-300 dark:border-indigo-600 border-t-indigo-600 dark:border-t-indigo-300 rounded-full animate-spin"></div>
          <p className="text-base font-medium text-slate-700 dark:text-slate-300">
            Loading history...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Request History
          </h2>
          <p className="text-base font-medium text-slate-700 dark:text-slate-300 mt-1">
            {pagination?.totalRequests || 0} total requests
          </p>
        </div>
        {history.length > 0 && (
          <button
            onClick={clearAllHistory}
            className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-base font-bold transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Empty State */}
      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-8xl mb-4">📋</div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            No request history yet
          </h3>
          <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
            Make some API requests to see them here
          </p>
        </div>
      ) : (
        <>
          {/* Grid of Request Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 grid-rows-2 gap-5 max-w-6xl mx-auto">
            {history.map((req) => (
              <div
                key={req._id}
                className="group glass rounded-xl p-4 border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-lg transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedRequest(req)}
              >
                {/* Method & Status Badges */}
                <div className="flex items-start justify-between mb-4">
                  <span
                    className={`${getMethodColor(req.method)} px-4 py-2 rounded-full text-sm font-extrabold border-2`}
                  >
                    {req.method}
                  </span>
                  <span
                    className={`${getStatusColor(req.response.status)} px-4 py-2 rounded-full text-sm font-extrabold border-2`}
                  >
                    {req.response.status}
                  </span>
                </div>

                {/* URL */}
                <div className="mb-2">
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Endpoint
                  </p>
                  <p
                    className="text-sm font-mono font-medium text-slate-900 dark:text-white truncate"
                    title={req.endpoint}
                  >
                    {req.endpoint}
                  </p>
                </div>

                {/* Timestamp */}
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {new Date(req.timestamp).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {/* Action Buttons - Show on Hover */}
                <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRequest(req);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-colors"
                  >
                    <FaEye size={16} />
                    View
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteRequest(req._id);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-colors"
                  >
                    <FaTrash size={16} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-5 py-3 rounded-lg border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FaChevronLeft size={18} />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .slice(0, 5)
                  .map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-12 h-12 text-base font-bold rounded-lg transition-all ${
                        currentPage === page
                          ? "bg-linear-to-r from-indigo-600 to-purple-600 text-white"
                          : "border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                {pagination.totalPages > 5 && (
                  <span className="text-slate-700 dark:text-slate-300 text-lg font-bold px-2">
                    ...
                  </span>
                )}
              </div>

              <button
                onClick={() =>
                  setCurrentPage(
                    Math.min(pagination.totalPages, currentPage + 1),
                  )
                }
                disabled={currentPage === pagination.totalPages}
                className="flex items-center gap-2 px-5 py-3 rounded-lg border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FaChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 rounded-2xl bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="glass rounded-2xl border-2 border-slate-300 dark:border-slate-600 w-full max-w-6xl max-h-[70vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between p-6 border-b-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800">
              <div className="flex items-center gap-4">
                <span
                  className={`${getMethodColor(selectedRequest.method)} px-4 py-2 rounded-full text-base font-extrabold border-2`}
                >
                  {selectedRequest.method}
                </span>
                <span
                  className={`${getStatusColor(selectedRequest.response.status)} px-4 py-2 rounded-full text-base font-extrabold border-2`}
                >
                  {selectedRequest.response.status}
                </span>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-3 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <FaTimes size={24} />
              </button>
            </div>

            {/* Content */}

            <div className="p-6">
              <ResponseShowcase
                request={{
                  url: selectedRequest.endpoint,
                  method: selectedRequest.method,
                  headers: normalizeHeaders(selectedRequest.request.headers),
                  body: selectedRequest.request.body
                    ? JSON.stringify(selectedRequest.request.body, null, 2)
                    : "",
                }}
                response={{
                  status: selectedRequest.response.status,
                  statusText: selectedRequest.response.statusText,
                  headers: normalizeHeaders(selectedRequest.response.headers),
                  body: selectedRequest.response.body,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestHistory;
