import * as XLSX from "xlsx";

export interface ExcelExportOptions {
  filename?: string;
  sheetName?: string;
  headers?: Record<string, string>; // Maps data keys to human-readable header titles
  autoWidth?: boolean;
}

/**
 * Automatically calculate reasonable column widths based on content length
 */
function calculateColumnWidths(data: any[], keys: string[]): { wch: number }[] {
  return keys.map((key) => {
    let maxLen = key.length;
    for (const row of data) {
      if (!row) continue;
      const val = row[key];
      if (val !== undefined && val !== null) {
        const strVal = typeof val === "object" ? JSON.stringify(val) : String(val);
        if (strVal.length > maxLen) {
          maxLen = Math.min(strVal.length, 60); // Cap at 60 chars
        }
      }
    }
    return { wch: Math.max(maxLen + 3, 10) };
  });
}

/**
 * Export JSON array of objects to an Excel (.xlsx) file
 */
export function exportJsonToExcel<T extends Record<string, any>>(
  data: T[],
  options: ExcelExportOptions = {}
) {
  if (!data || data.length === 0) {
    console.warn("No data provided for Excel export");
    return;
  }

  const {
    filename = "export.xlsx",
    sheetName = "Sheet1",
    headers,
    autoWidth = true,
  } = options;

  let exportData: any[] = data;

  // If custom headers mapping is provided, transform the keys
  if (headers) {
    const headerKeys = Object.keys(headers);
    exportData = data.map((item) => {
      const formattedItem: Record<string, any> = {};
      for (const key of headerKeys) {
        if (key in item) {
          formattedItem[headers[key]] = item[key];
        }
      }
      // Include any remaining keys that weren't in headers map if desired, or stick strictly to headers
      return formattedItem;
    });
  }

  const ws = XLSX.utils.json_to_sheet(exportData);

  if (autoWidth && exportData.length > 0) {
    const keys = Object.keys(exportData[0]);
    ws["!cols"] = calculateColumnWidths(exportData, keys);
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31)); // Excel limits sheet names to 31 chars

  const sanitizedFilename = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  XLSX.writeFile(wb, sanitizedFilename);
}

/**
 * Export raw 2D Array / Matrix to an Excel (.xlsx) file
 */
export function exportAoaToExcel(
  aoa: any[][],
  options: ExcelExportOptions = {}
) {
  if (!aoa || aoa.length === 0) {
    console.warn("No array data provided for Excel export");
    return;
  }

  const {
    filename = "export.xlsx",
    sheetName = "Sheet1",
    autoWidth = true,
  } = options;

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  if (autoWidth) {
    const colWidths: { wch: number }[] = [];
    aoa.forEach((row) => {
      row.forEach((cell, colIdx) => {
        const strVal = cell !== undefined && cell !== null ? String(cell) : "";
        colWidths[colIdx] = {
          wch: Math.max(colWidths[colIdx]?.wch || 10, strVal.length + 3),
        };
      });
    });
    ws["!cols"] = colWidths;
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));

  const sanitizedFilename = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  XLSX.writeFile(wb, sanitizedFilename);
}

/**
 * Export HTML <table> directly to an Excel (.xlsx) file
 */
export function exportTableElementToExcel(
  tableElement: HTMLTableElement,
  options: ExcelExportOptions = {}
) {
  if (!tableElement) {
    console.warn("No table element provided for Excel export");
    return;
  }

  const { filename = "table-export.xlsx", sheetName = "Sheet1" } = options;

  const wb = XLSX.utils.table_to_book(tableElement, {
    sheet: sheetName.substring(0, 31),
    raw: false,
  });

  const sanitizedFilename = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  XLSX.writeFile(wb, sanitizedFilename);
}
