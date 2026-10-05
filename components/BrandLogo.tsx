import React from "react";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "light" | "dark" | "glass";
  showText?: boolean;
  roleSubtitle?: string;
}

export default function BrandLogo({
  size = "md",
  variant = "light",
  showText = true,
  roleSubtitle,
}: BrandLogoProps) {
  const iconSizes = {
    sm: "w-8 h-8 rounded-lg p-1.5",
    md: "w-10 h-10 rounded-xl p-2",
    lg: "w-14 h-14 rounded-2xl p-3",
  };

  const isDark = variant === "dark";
  const isGlass = variant === "glass";

  return (
    <div className="flex items-center gap-2.5 select-none">
      {/* Tech Emblem Badge */}
      <div
        className={`${iconSizes[size]} relative flex items-center justify-center flex-shrink-0 transition-transform hover:scale-105 ${
          isGlass
            ? "bg-white/15 border border-white/25 shadow-inner backdrop-blur-md"
            : "bg-gradient-to-tr from-brand-700 via-brand-600 to-indigo-500 shadow-md shadow-brand-500/20 border border-white/20"
        }`}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full text-white drop-shadow-sm"
        >
          {/* Hexagonal Tech Node Shell */}
          <path
            d="M16 3L27.5 9.5V22.5L16 29L4.5 22.5V9.5L16 3Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-75"
          />
          {/* Internal Isometric Automation Vectors */}
          <path
            d="M16 3V16M16 16L27.5 22.5M16 16L4.5 22.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-60"
          />
          {/* Central Pulse Node */}
          <circle cx="16" cy="16" r="3" fill="#ffffff" />
          <circle cx="16" cy="16" r="5" stroke="#ffffff" strokeWidth="1" className="opacity-40 animate-pulse" />
        </svg>
      </div>

      {showText && (
        <div className="min-w-0 text-left">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-bold tracking-tight truncate ${
                size === "lg" ? "text-2xl" : size === "sm" ? "text-xs" : "text-sm"
              } ${isDark || isGlass ? "text-white" : "text-gray-900"}`}
            >
              SFA Portal
            </span>
            <span
              className={`px-1.5 py-0.2 rounded font-semibold uppercase tracking-wider text-[8px] ${
                isDark || isGlass
                  ? "bg-white/20 text-white border border-white/25"
                  : "bg-brand-50 text-brand-700 border border-brand-200"
              }`}
            >
              Enterprise
            </span>
          </div>
          <p
            className={`truncate font-medium ${
              size === "lg" ? "text-xs mt-0.5" : "text-[10px]"
            } ${
              isDark || isGlass ? "text-blue-200/80" : "text-gray-500"
            }`}
          >
            {roleSubtitle ? `Sales Force Platform · ${roleSubtitle}` : "Sales Force Automation"}
          </p>
        </div>
      )}
    </div>
  );
}
