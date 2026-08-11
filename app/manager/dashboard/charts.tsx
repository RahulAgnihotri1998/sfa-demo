"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { BarChart3 } from "lucide-react";

type TerritoryDatum = { territory: string; count: number };

const BAR_COLOR = "#2952e3";
const BAR_COLOR_LIGHT = "#a8b8f5";

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { territory, count } = payload[0].payload;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md">
      <p className="text-xs font-medium text-gray-500">{territory}</p>
      <p className="text-sm font-semibold text-gray-900">
        {count} {count === 1 ? "customer" : "customers"}
      </p>
    </div>
  );
}

export default function DashboardCharts({ territoryData }: { territoryData: TerritoryDatum[] }) {
  const total = useMemo(
    () => territoryData?.reduce((sum, d) => sum + (d.count ?? 0), 0) ?? 0,
    [territoryData]
  );

  const maxIndex = useMemo(() => {
    if (!territoryData?.length) return -1;
    return territoryData.reduce(
      (best, d, i) => (d.count > territoryData[best].count ? i : best),
      0
    );
  }, [territoryData]);

  const hasData = territoryData && territoryData.length > 0 && total > 0;

  return (
    <div className="card p-5">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700">Customers by territory</h2>
        {hasData && (
          <span className="text-xs text-gray-400">
            {total} total across {territoryData.length} {territoryData.length === 1 ? "territory" : "territories"}
          </span>
        )}
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <BarChart3 className="text-gray-300" size={28} />
          <p className="text-sm text-gray-400">No territory data yet.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={territoryData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="territory"
              tick={{ fontSize: 12, fill: "#6b7280" }}
              axisLine={{ stroke: "#e5e7eb" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#6b7280" }}
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8f9fc" }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
              {territoryData.map((_, i) => (
                <Cell key={i} fill={i === maxIndex ? BAR_COLOR : BAR_COLOR_LIGHT} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}