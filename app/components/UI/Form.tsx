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
    GET: "bg-primary/10 text-primary border-primary/30",
    POST: "bg-accent/10 text-accent border-accent/30",
    PUT: "bg-amber-400/20 text-amber-600 border-amber-400/40",
    DELETE: "bg-destructive/10 text-destructive border-destructive/30",
    PATCH: "bg-fuchsia-400/20 text-fuchsia-600 border-fuchsia-400/40",
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
        <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-5 text-destructive">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="text-lg font-bold">
              {urlerror ? "Invalid URL" : "Request Failed"}
            </p>
            <p className="text-base font-medium">{urlerror || requestError}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setUrlerror("");
              setRequestError("");
            }}
            className="ml-auto flex items-center justify-center w-8 h-8 rounded-md border border-destructive/30 bg-destructive/10 text-destructive text-lg font-bold hover:bg-destructive/20 transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* URL Input */}
      <div className="space-y-2">
        <label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Request URL
        </label>
        <input
          type="text"
          value={url}
          placeholder="https://api.example.com/users"
          className="w-full rounded-lg border border-input bg-background px-5 py-4 text-base font-medium text-foreground placeholder:text-muted-foreground transition-all focus:outline-none focus:ring-2 focus:ring-ring"
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
          <label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Method
          </label>
          <div className="grid grid-cols-2 gap-2">
            {methods.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={`rounded-lg border px-4 py-3 text-base font-bold transition-all ${
                  method === m
                    ? "bg-primary text-primary-foreground border-primary shadow-[0_0_18px_rgba(0,255,170,0.35)]"
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
          <label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Quick Templates
          </label>
          <div className="grid grid-cols-2 gap-2 text-foreground md:grid-cols-3">
            <button
              type="button"
              onClick={() =>
                setUrl("https://jsonplaceholder.typicode.com/posts")
              }
              className="rounded-lg border border-border bg-muted/60 px-4 py-3 text-base font-bold transition-colors hover:bg-muted"
            >
              JSONPlaceholder
            </button>
            <button
              type="button"
              onClick={() => setUrl("https://api.github.com/users/github")}
              className="rounded-lg border border-border bg-muted/60 px-4 py-3 text-base font-bold transition-colors hover:bg-muted"
            >
              GitHub API
            </button>
            <button
              type="button"
              onClick={() => setUrl("")}
              className="rounded-lg border border-border bg-muted/60 px-4 py-3 text-base font-bold transition-colors hover:bg-muted"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Headers Section */}
      {method !== "GET" && (
        <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-5">
          <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
            Headers
          </h3>

          {/* Add Header */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
            <input
              type="text"
              placeholder="Header name"
              value={headersKey}
              className="md:col-span-2 rounded-lg border border-input bg-background px-4 py-3 text-base font-medium text-foreground placeholder:text-muted-foreground"
              onChange={(e) => setHeadersKey(e.target.value)}
            />
            <input
              type="text"
              placeholder="Header value"
              value={headersValue}
              className="md:col-span-2 rounded-lg border border-input bg-background px-4 py-3 text-base font-medium text-foreground placeholder:text-muted-foreground"
              onChange={(e) => setHeadersValue(e.target.value)}
            />
            <button
              type="button"
              onClick={addMoreHeaders}
              disabled={!headersKey.trim() || !headersValue.trim()}
              className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-base font-bold text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FaPlus size={18} />
              <span className="hidden sm:inline">Add</span>
            </button>
          </div>

          {/* Headers List */}
          {headers.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                Added Headers ({headers.length})
              </div>
              {headers.map((header, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/80 p-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-base font-bold text-foreground">
                      {header.key}
                    </p>
                    <p className="truncate text-sm font-medium text-muted-foreground">
                      {header.value}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setHeaders(headers.filter((_, i) => i !== index))
                    }
                    className="rounded-lg p-2 text-destructive transition-colors hover:bg-destructive/10"
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
          <label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Request Body (JSON)
          </label>
          <textarea
            placeholder={`{\n  "key": "value",\n  "name": "example"\n}`}
            className="h-32 w-full resize-none rounded-lg border border-input bg-background px-5 py-4 font-mono text-base font-medium text-foreground placeholder:text-muted-foreground transition-all focus:outline-none focus:ring-2 focus:ring-ring"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !url}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-5 text-xl font-bold text-primary-foreground transition-all duration-300 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
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
