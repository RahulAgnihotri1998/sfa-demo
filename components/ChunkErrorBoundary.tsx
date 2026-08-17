"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  isChunkError: boolean;
  errorMessage: string;
}

/**
 * Catches ChunkLoadError (stale JS chunk references after a redeployment)
 * and safely attempts a single hard reload so the browser fetches the new chunks,
 * with guard protection to prevent infinite reload loops.
 */
export default class ChunkErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, isChunkError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    const isChunkError =
      error.name === "ChunkLoadError" ||
      error.message?.includes("Loading chunk") ||
      error.message?.includes("Failed to fetch dynamically imported module") ||
      error.message?.includes("Importing a module script failed");
    return { hasError: true, isChunkError, errorMessage: error.message || "" };
  }

  componentDidCatch(error: Error) {
    const isChunkError =
      error.name === "ChunkLoadError" ||
      error.message?.includes("Loading chunk") ||
      error.message?.includes("Failed to fetch dynamically imported module") ||
      error.message?.includes("Importing a module script failed");

    if (isChunkError && typeof window !== "undefined") {
      const reloadKey = "chunk_error_last_reload";
      const lastReload = sessionStorage.getItem(reloadKey);
      const now = Date.now();

      // Only attempt reload once if we haven't reloaded in the last 15 seconds
      if (!lastReload || now - parseInt(lastReload, 10) > 15000) {
        sessionStorage.setItem(reloadKey, now.toString());
        const targetUrl = new URL(window.location.href);
        targetUrl.searchParams.set("_v", now.toString());
        window.location.replace(targetUrl.toString());
      } else {
        console.warn("ChunkErrorBoundary prevented infinite reload loop.");
      }
    }
  }

  render() {
    if (this.state.hasError && this.state.isChunkError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "24px",
            gap: "16px",
            fontFamily: "system-ui, sans-serif",
            color: "#374151",
            backgroundColor: "#f9fafb",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              backgroundColor: "#eff6ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#2563eb",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: "bold", margin: "0 0 8px 0" }}>
              Application Updated
            </h2>
            <p style={{ fontSize: "14px", color: "#6b7280", margin: 0, maxWidth: "360px" }}>
              A new code update was deployed. Click below to load the latest version.
            </p>
          </div>
          <button
            onClick={() => {
              sessionStorage.removeItem("chunk_error_last_reload");
              const targetUrl = new URL(window.location.href);
              targetUrl.searchParams.set("_v", Date.now().toString());
              window.location.replace(targetUrl.toString());
            }}
            style={{
              backgroundColor: "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              padding: "10px 20px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
            }}
          >
            Load Latest Version
          </button>
        </div>
      );
    }

    if (this.state.hasError && !this.state.isChunkError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "80vh",
            padding: "24px",
            gap: "16px",
            fontFamily: "system-ui, sans-serif",
            color: "#991b1b",
            backgroundColor: "#fef2f2",
            textAlign: "center",
            borderRadius: "16px",
            margin: "24px",
            border: "1px solid #fecaca",
          }}
        >
          <h3 style={{ fontSize: "18px", fontWeight: "bold", margin: 0 }}>
            Component Display Error
          </h3>
          <p style={{ fontSize: "13px", color: "#b91c1c", margin: 0, maxWidth: "420px" }}>
            {this.state.errorMessage || "An unexpected error occurred while rendering this page."}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, isChunkError: false, errorMessage: "" });
              window.location.reload();
            }}
            style={{
              backgroundColor: "#dc2626",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              padding: "10px 20px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Reload View
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
