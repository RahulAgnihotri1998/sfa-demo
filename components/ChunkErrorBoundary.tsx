"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  isChunkError: boolean;
}

/**
 * Catches ChunkLoadError (stale JS chunk references after a redeployment)
 * and automatically does a hard reload so the browser fetches the new chunks.
 *
 * Any other runtime error falls through to Next.js's default error UI.
 */
export default class ChunkErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, isChunkError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    const isChunkError =
      error.name === "ChunkLoadError" ||
      error.message?.includes("Loading chunk") ||
      error.message?.includes("Failed to fetch dynamically imported module") ||
      error.message?.includes("Importing a module script failed");
    return { hasError: true, isChunkError };
  }

  componentDidCatch(error: Error) {
    const isChunkError =
      error.name === "ChunkLoadError" ||
      error.message?.includes("Loading chunk") ||
      error.message?.includes("Failed to fetch dynamically imported module") ||
      error.message?.includes("Importing a module script failed");

    if (isChunkError) {
      // Hard reload to fetch fresh chunks from the new build
      window.location.reload();
    }
  }

  render() {
    // While we're waiting for the reload to happen, show a minimal loading screen
    if (this.state.hasError && this.state.isChunkError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            gap: "12px",
            fontFamily: "system-ui, sans-serif",
            color: "#6b7280",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ animation: "spin 1s linear infinite" }}
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <p style={{ fontSize: "14px", margin: 0 }}>Updating app, please wait…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      );
    }

    return this.props.children;
  }
}
