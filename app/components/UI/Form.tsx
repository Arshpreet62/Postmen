"use client";

import React, { useState } from "react";
import { useGlobal } from "../Layout/context/Context";
import { apiUrl } from "../../config/api";
import { FaPlus, FaTrash, FaCheckCircle } from "react-icons/fa";

export default function Form() {
  type Header = {
    key: string;
    value: string;
  };
  const { setResponseData, token } = useGlobal();
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState("GET");
  const [headers, setHeaders] = useState<Header[]>([]);
  const [body, setBody] = useState("");
  const [headersKey, setHeadersKey] = useState("");
  const [headersValue, setHeadersValue] = useState("");
  const [urlerror, setUrlerror] = useState("");
  const [requestError, setRequestError] = useState("");
  const [loading, setLoading] = useState(false);

  const methods = ["GET", "POST", "PUT", "DELETE", "PATCH"];

  const methodColors: Record<string, string> = {
    GET: "bg-blue-500/20 text-blue-600 border-blue-200",
    POST: "bg-green-500/20 text-green-600 border-green-200",
    PUT: "bg-yellow-500/20 text-yellow-600 border-yellow-200",
    DELETE: "bg-red-500/20 text-red-600 border-red-200",
    PATCH: "bg-purple-500/20 text-purple-600 border-purple-200",
  };

  const addMoreHeaders = () => {
    if (headersKey.trim() && headersValue.trim()) {
      setHeaders([
        ...headers,
        { key: headersKey.trim(), value: headersValue.trim() },
      ]);
      setHeadersKey("");
      setHeadersValue("");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      new URL(url);
      setUrlerror("");
    } catch {
      setUrlerror("Please enter a valid URL");
      return;
    }

    const finalHeaders = [...headers];
    if (headersKey.trim() && headersValue.trim()) {
      finalHeaders.push({ key: headersKey.trim(), value: headersValue.trim() });
    }

    const check = finalHeaders.some(
      (header) => header.key.toLowerCase() === "content-type",
    );
    if (!check && method !== "GET") {
      finalHeaders.push({ key: "Content-Type", value: "application/json" });
    }

    // Convert headers array to object
    const headersObject: Record<string, string> = {};
    finalHeaders.forEach((h) => {
      headersObject[h.key] = h.value;
    });

    setLoading(true);
    try {
      const response = await fetch(apiUrl("/api/request"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          url,
          method,
          headers: finalHeaders,
          body: method === "GET" ? null : body,
        }),
      });

      const result = await response.json();

      const requestPayload = result?.request ?? {
        url,
        method,
        headers: headersObject,
        body: method === "GET" ? "" : body,
      };

      const responsePayload = result?.response ?? {
        status: response.status,
        statusText: response.statusText || "Unknown",
        headers: {},
        body: result,
      };

      setResponseData({
        request: requestPayload,
        response: responsePayload,
        savedToHistory: result?.savedToHistory ?? false,
      });

      setHeaders([]);
      setHeadersKey("");
      setHeadersValue("");
      setUrl("");
      setMethod("GET");
      setBody("");
    } catch (error) {
      console.error("Request failed:", error);
      setRequestError("Failed to send request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Alert */}
      {(urlerror || requestError) && (
        <div className="p-5 rounded-lg bg-red-100 dark:bg-red-900/30 border-2 border-red-400 dark:border-red-600 flex items-start gap-3">
          <span className="text-red-600 dark:text-red-400 text-2xl mt-1">
            ⚠️
          </span>
          <div>
            <p className="text-lg font-bold text-red-800 dark:text-red-300">
              {urlerror ? "Invalid URL" : "Request Failed"}
            </p>
            <p className="text-base font-medium text-red-700 dark:text-red-200">
              {urlerror || requestError}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setUrlerror("");
              setRequestError("");
            }}
            className="ml-auto text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 text-2xl font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* URL Input */}
      <div className="space-y-2">
        <label className="text-base font-bold text-slate-800 dark:text-slate-200">
          Request URL
        </label>
        <input
          type="text"
          value={url}
          placeholder="https://api.example.com/users"
          className="w-full input-smooth px-5 py-4 text-base font-medium bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          onChange={(e) => {
            setUrl(e.target.value);
            setUrlerror("");
          }}
        />
      </div>

      {/* Method & Headers Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Method Selector */}
        <div className="space-y-2">
          <label className="text-base font-bold text-slate-800 dark:text-slate-200">
            Method
          </label>
          <div className="grid grid-cols-2 gap-2">
            {methods.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={`py-3 px-4 rounded-lg font-bold text-base transition-all border-2 ${
                  method === m
                    ? "bg-indigo-600 text-white border-indigo-600 scale-105"
                    : methodColors[m]
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Templates */}
        <div className="md:col-span-3 space-y-2">
          <label className="text-base font-bold text-slate-800 dark:text-slate-200">
            Quick Templates
          </label>
          <div className="grid text-white grid-cols-2 md:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() =>
                setUrl("https://jsonplaceholder.typicode.com/posts")
              }
              className="px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200  dark:hover:bg-slate-700 rounded-lg text-base font-bold transition-colors"
            >
              JSONPlaceholder
            </button>
            <button
              type="button"
              onClick={() => setUrl("https://api.github.com/users/github")}
              className="px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-base font-bold transition-colors"
            >
              GitHub API
            </button>
            <button
              type="button"
              onClick={() => setUrl("")}
              className="px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-base font-bold transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Headers Section */}
      {method !== "GET" && (
        <div className="space-y-4 p-5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Headers
          </h3>

          {/* Add Header */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
            <input
              type="text"
              placeholder="Header name"
              value={headersKey}
              className="md:col-span-2 input-smooth px-4 py-3 text-base font-medium bg-white dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400"
              onChange={(e) => setHeadersKey(e.target.value)}
            />
            <input
              type="text"
              placeholder="Header value"
              value={headersValue}
              className="md:col-span-2 input-smooth px-4 py-3 text-base font-medium bg-white dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400"
              onChange={(e) => setHeadersValue(e.target.value)}
            />
            <button
              type="button"
              onClick={addMoreHeaders}
              disabled={!headersKey.trim() || !headersValue.trim()}
              className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-base font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <FaPlus size={18} />
              <span className="hidden sm:inline">Add</span>
            </button>
          </div>

          {/* Headers List */}
          {headers.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Added Headers ({headers.length})
              </div>
              {headers.map((header, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-4 bg-white dark:bg-slate-700 rounded-lg border-2 border-slate-300 dark:border-slate-600"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-slate-900 dark:text-white truncate">
                      {header.key}
                    </p>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 truncate">
                      {header.value}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setHeaders(headers.filter((_, i) => i !== index))
                    }
                    className="p-2 hover:bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                  >
                    <FaTrash size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Body Input */}
      {method !== "GET" && (
        <div className="space-y-2">
          <label className="text-base font-bold text-slate-800 dark:text-slate-200">
            Request Body (JSON)
          </label>
          <textarea
            placeholder={`{\n  "key": "value",\n  "name": "example"\n}`}
            className="w-full input-smooth px-5 py-4 text-base font-medium bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 font-mono h-32 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !url}
        className="w-full btn-gradient py-5 text-white text-xl font-bold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
      >
        {loading ? (
          <>
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            Sending...
          </>
        ) : (
          <>
            <FaCheckCircle size={20} />
            Send Request
          </>
        )}
      </button>
    </form>
  );
}
