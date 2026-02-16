"use client";

import React, { useState } from "react";
import {
  FaCheckCircle,
  FaCopy,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";

export type RequestData = {
  url: string;
  method: string;
  headers: Record<string, string> | Array<{ key: string; value: string }>;
  body: string;
};

export type ResponseData = {
  status: number;
  statusText?: string;
  headers?: Record<string, string>;
  body: any;
  timing?: number;
  size?: number;
  savedToHistory?: boolean;
};

type Props = {
  request?: RequestData;
  response?: ResponseData;
};

const ResponseShowcase: React.FC<Props> = ({ request, response }) => {
  const [copied, setCopied] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    headers: false,
    body: true,
  });

  if (!request || !response) return null;

  const isSuccess = response.status >= 200 && response.status < 300;
  const isClientError = response.status >= 400 && response.status < 500;
  const isServerError = response.status >= 500;

  const statusColor = isSuccess
    ? "bg-green-500/20 text-green-700 dark:text-green-400 border-green-300 dark:border-green-600"
    : isClientError
      ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-600"
      : isServerError
        ? "bg-red-500/20 text-red-700 dark:text-red-400 border-red-300 dark:border-red-600"
        : "bg-muted text-muted-foreground border-border";

  const headers = Array.isArray(request.headers)
    ? Object.fromEntries(request.headers.map((h) => [h.key, h.value]))
    : request.headers;

  const generatedFetchCode = () => {
    const method = request.method;
    const body =
      method !== "GET" && request.body
        ? `body: JSON.stringify(${JSON.stringify(JSON.parse(request.body || "{}"), null, 2)})`
        : "";

    return `fetch("${request.url}", {
  method: "${method}",
  headers: ${JSON.stringify(headers, null, 2)},
  ${body ? body + "," : ""}
})
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));`;
  };

  const code = generatedFetchCode();

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Response Status Card */}
      <div className={`rounded-lg border p-6 ${statusColor}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isSuccess && (
              <FaCheckCircle className="text-green-600" size={28} />
            )}
            {isClientError && <span className="text-3xl">⚠️</span>}
            {isServerError && <span className="text-3xl">❌</span>}
            <div>
              <p className="text-sm font-semibold opacity-75">
                Response Status
              </p>
              <p className="text-3xl font-bold">
                {response.status} {response.statusText}
              </p>
            </div>
          </div>
          <div className="text-right space-y-1">
            {response.timing && (
              <div className="text-sm">
                <span className="font-semibold">Time:</span> {response.timing}ms
              </div>
            )}
            {response.size && (
              <div className="text-sm">
                <span className="font-semibold">Size:</span>{" "}
                {(response.size / 1024).toFixed(2)} KB
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Request URL Info */}
      <div className="rounded-lg bg-muted p-5 border border-border">
        <p className="text-base font-mono font-bold text-muted-foreground mb-2">
          {request.method}
        </p>
        <p className="text-foreground font-mono text-base font-medium break-all">
          {request.url}
        </p>
      </div>

      {/* Headers Section */}
      {response.headers && Object.keys(response.headers).length > 0 && (
        <div className="rounded-lg border-2 border-border overflow-hidden">
          <button
            onClick={() => toggleSection("headers")}
            className="w-full flex items-center justify-between p-5 bg-muted/50 hover:bg-muted transition-colors"
          >
            <h3 className="text-lg font-bold text-foreground">
              Response Headers ({Object.keys(response.headers).length})
            </h3>
            {expandedSections.headers ? (
              <FaChevronUp size={18} />
            ) : (
              <FaChevronDown size={18} />
            )}
          </button>
          {expandedSections.headers && (
            <div className="p-5 bg-slate-900 dark:bg-slate-950 border-t-2 border-border max-h-64 overflow-auto">
              <div className="space-y-3 font-mono text-base">
                {Object.entries(response.headers).map(([key, value]) => (
                  <div key={key} className="flex gap-3">
                    <span className="text-primary font-bold text-base">
                      {key}:
                    </span>
                    <span className="text-slate-200 break-all font-medium">
                      {value as string}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Response Body Section */}
      <div className="rounded-lg border-2 border-border overflow-hidden">
        <button
          onClick={() => toggleSection("body")}
          className="w-full flex items-center justify-between p-5 bg-muted/50 hover:bg-muted transition-colors"
        >
          <h3 className="text-lg font-bold text-foreground">Response Body</h3>
          {expandedSections.body ? (
            <FaChevronUp size={18} />
          ) : (
            <FaChevronDown size={18} />
          )}
        </button>
        {expandedSections.body && (
          <div className="p-5 bg-slate-900 dark:bg-slate-950 border-t-2 border-border">
            <pre className="text-slate-200 font-mono text-base font-medium overflow-auto max-h-96 whitespace-pre-wrap break-words">
              {JSON.stringify(response.body, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Fetch Code Generator */}
      <div className="rounded-lg border-2 border-border overflow-hidden">
        <div className="flex items-center justify-between p-5 bg-primary/10 border-b-2 border-primary/30">
          <h3 className="text-lg font-bold text-foreground">
            Generated Fetch Code
          </h3>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-base font-bold transition-all"
          >
            <FaCopy size={16} />
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <div className="p-5 bg-slate-900 dark:bg-slate-950">
          <pre className="text-slate-200 font-mono text-base font-medium overflow-auto max-h-64 whitespace-pre-wrap break-words">
            {code}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default ResponseShowcase;
