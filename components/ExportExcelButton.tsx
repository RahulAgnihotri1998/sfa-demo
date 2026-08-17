"use client";

import React, { useState } from "react";
import { FileSpreadsheet, Check, Download } from "lucide-react";
import { exportJsonToExcel, exportAoaToExcel, exportTableElementToExcel, ExcelExportOptions } from "@/lib/excelExport";

export interface ExportExcelButtonProps {
  data?: any[] | (() => any[]);
  aoaData?: any[][] | (() => any[][]);
  tableRef?: React.RefObject<HTMLTableElement | null>;
  tableId?: string;
  filename?: string;
  sheetName?: string;
  headers?: Record<string, string>;
  label?: string;
  title?: string;
  variant?: "primary" | "secondary" | "outline" | "subtle" | "dark" | "icon";
  size?: "xs" | "sm" | "md";
  className?: string;
  disabled?: boolean;
}

export default function ExportExcelButton({
  data,
  aoaData,
  tableRef,
  tableId,
  filename = "sfa-data-export",
  sheetName = "Sheet1",
  headers,
  label = "Export Excel",
  title = "Export this data table as Excel (.xlsx)",
  variant = "outline",
  size = "xs",
  className = "",
  disabled = false,
}: ExportExcelButtonProps) {
  const [exported, setExported] = useState(false);

  const handleExport = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (tableRef?.current) {
        exportTableElementToExcel(tableRef.current, { filename, sheetName });
      } else if (tableId) {
        const tableEl = document.getElementById(tableId) as HTMLTableElement;
        if (tableEl) {
          exportTableElementToExcel(tableEl, { filename, sheetName });
        } else {
          console.warn(`Table element with id "${tableId}" not found`);
        }
      } else if (aoaData) {
        const resolvedAoa = typeof aoaData === "function" ? aoaData() : aoaData;
        exportAoaToExcel(resolvedAoa, { filename, sheetName });
      } else if (data) {
        const resolvedData = typeof data === "function" ? data() : data;
        exportJsonToExcel(resolvedData, { filename, sheetName, headers });
      }

      setExported(true);
      setTimeout(() => setExported(false), 2000);
    } catch (err) {
      console.error("Failed to export Excel spreadsheet:", err);
    }
  };

  // Base styling
  const sizeClasses = {
    xs: "px-2.5 py-1 text-[11px] font-semibold gap-1.5 rounded-lg",
    sm: "px-3 py-1.5 text-xs font-semibold gap-1.5 rounded-lg",
    md: "px-4 py-2 text-sm font-semibold gap-2 rounded-xl",
  }[size];

  const variantClasses = {
    primary: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm border border-emerald-600 transition-colors",
    secondary: "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors",
    outline: "bg-white hover:bg-emerald-50/70 text-emerald-800 border border-emerald-300 hover:border-emerald-400 shadow-xs transition-colors",
    subtle: "bg-gray-50 hover:bg-emerald-50 text-gray-700 hover:text-emerald-800 border border-gray-200 transition-colors",
    dark: "bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 transition-colors",
    icon: "p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg border border-transparent hover:border-emerald-200 transition-all",
  }[variant];

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleExport}
        disabled={disabled}
        title={title}
        className={`inline-flex items-center justify-center ${variantClasses} ${disabled ? "opacity-40 cursor-not-allowed" : ""} ${className}`}
      >
        {exported ? (
          <Check size={14} className="text-emerald-600 animate-in zoom-in-75" />
        ) : (
          <FileSpreadsheet size={14} className="text-emerald-600" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center select-none ${sizeClasses} ${variantClasses} ${
        disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
      } ${className}`}
    >
      {exported ? (
        <>
          <Check size={size === "md" ? 16 : 13} className="text-emerald-600 animate-in zoom-in-75" />
          <span className="text-emerald-700 font-bold">Exported!</span>
        </>
      ) : (
        <>
          <FileSpreadsheet size={size === "md" ? 16 : 13} className="text-emerald-600" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
