/**
 * Market Basket Analysis & Next Best Action Engine
 * 
 * This module provides:
 * 1. Cross-sell association rules (simulated Apriori/FP-Growth output)
 * 2. Next Best Action recommendations with recency gap + margin scoring
 * 3. Forecast accuracy tracking with historical snapshots
 */

// ═══════════════════════════════════════════════════════════════
// 1. MARKET BASKET ANALYSIS — Cross-Sell Association Rules
// ═══════════════════════════════════════════════════════════════

export interface CrossSellRule {
  id: string;
  sourceProductId: string;
  sourceProductName: string;
  targetProductId: string;
  targetProductName: string;
  confidence: number;
  support: number;
  lift: number;
  reason: string;
  provenance: "association_rule" | "category_affinity" | "manual_merchandising";
}

export const CROSS_SELL_RULES: CrossSellRule[] = [
  {
    id: "xsell-001",
    sourceProductId: "a0000001-0000-0000-0000-000000000012",
    sourceProductName: "Wheat Flour – Type 405 25kg",
    targetProductId: "a0000001-0000-0000-0000-000000000004",
    targetProductName: "BOS Special Bakery Mix 25kg",
    confidence: 0.78, support: 0.42, lift: 2.3,
    reason: "78% of customers who buy Wheat Flour Type 405 also order BOS Special Bakery Mix",
    provenance: "association_rule",
  },
  {
    id: "xsell-002",
    sourceProductId: "a0000001-0000-0000-0000-000000000004",
    sourceProductName: "BOS Special Bakery Mix 25kg",
    targetProductId: "a0000001-0000-0000-0000-000000000003",
    targetProductName: "Confibel Apricot Jam 13kg Pail",
    confidence: 0.65, support: 0.35, lift: 1.9,
    reason: "65% of BOS Special buyers also purchase Confibel Apricot Jam for Danish pastry glazing",
    provenance: "association_rule",
  },
  {
    id: "xsell-003",
    sourceProductId: "a0000001-0000-0000-0000-000000000001",
    sourceProductName: "Amarena Fabbri Gourmet Sauce 950g",
    targetProductId: "a0000001-0000-0000-0000-000000000005",
    targetProductName: "Delipaste – Salted Butter Caramel 1.5kg",
    confidence: 0.72, support: 0.38, lift: 2.1,
    reason: "72% of Amarena Fabbri buyers also purchase Delipaste Salted Butter Caramel (gelato flavor pairing)",
    provenance: "association_rule",
  },
  {
    id: "xsell-004",
    sourceProductId: "a0000001-0000-0000-0000-000000000005",
    sourceProductName: "Delipaste – Salted Butter Caramel 1.5kg",
    targetProductId: "a0000001-0000-0000-0000-000000000001",
    targetProductName: "Amarena Fabbri Gourmet Sauce 950g",
    confidence: 0.68, support: 0.38, lift: 2.0,
    reason: "68% of Delipaste buyers also order Amarena Fabbri Gourmet Sauce for dessert menus",
    provenance: "association_rule",
  },
  {
    id: "xsell-005",
    sourceProductId: "a0000001-0000-0000-0000-000000000003",
    sourceProductName: "Confibel Apricot Jam 13kg Pail",
    targetProductId: "a0000001-0000-0000-0000-000000000012",
    targetProductName: "Wheat Flour – Type 405 25kg",
    confidence: 0.82, support: 0.45, lift: 1.8,
    reason: "82% of Apricot Jam buyers also order Type 405 Flour for pastry and viennoiserie production",
    provenance: "association_rule",
  },
  {
    id: "xsell-006",
    sourceProductId: "a0000001-0000-0000-0000-000000000002",
    sourceProductName: "Amarena Fabbri Nut Brittle Snackolosi 4.2kg",
    targetProductId: "a0000001-0000-0000-0000-000000000001",
    targetProductName: "Amarena Fabbri Gourmet Sauce 950g",
    confidence: 0.74, support: 0.28, lift: 2.5,
    reason: "74% of Nut Brittle buyers pair it with Amarena Sauce for premium gelato toppings",
    provenance: "category_affinity",
  },
  {
    id: "xsell-007",
    sourceProductId: "a0000001-0000-0000-0000-000000000012",
    sourceProductName: "Wheat Flour – Type 405 25kg",
    targetProductId: "a0000001-0000-0000-0000-000000000003",
    targetProductName: "Confibel Apricot Jam 13kg Pail",
    confidence: 0.61, support: 0.34, lift: 1.7,
    reason: "61% of Wheat Flour buyers also order Apricot Jam for tart glazing & croissant finishing",
    provenance: "association_rule",
  },
];

export function getCrossSellRecommendations(
  cartProductIds: string[],
  maxResults = 3
): CrossSellRule[] {
  if (cartProductIds.length === 0) return [];
  const inCart = new Set(cartProductIds);
  const matches = CROSS_SELL_RULES
    .filter((rule) => inCart.has(rule.sourceProductId) && !inCart.has(rule.targetProductId))
    .reduce((acc, rule) => {
      const existing = acc.find((r) => r.targetProductId === rule.targetProductId);
      if (!existing || rule.confidence > existing.confidence) {
        return [...acc.filter((r) => r.targetProductId !== rule.targetProductId), rule];
      }
      return acc;
    }, [] as CrossSellRule[])
    .sort((a, b) => (b.confidence * b.lift) - (a.confidence * a.lift))
    .slice(0, maxResults);
  return matches;
}


// ═══════════════════════════════════════════════════════════════
// 2. NEXT BEST ACTION — Recency + Margin Scoring Engine
// ═══════════════════════════════════════════════════════════════

export type NBAProvenance = "rule_recency_gap" | "rule_high_margin" | "rule_declining_volume" | "rule_expiry_push" | "ai_model_score";

export interface NextBestAction {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  score: number;
  reason: string;
  actionLabel: string;
  provenance: NBAProvenance;
  context: {
    daysSinceLastOrder?: number;
    marginPct?: number;
    volumeDropPct?: number;
    daysUntilExpiry?: number;
  };
}

interface NBAProductInput {
  id: string;
  name: string;
  sku: string;
  base_price: number;
  stock_status: string;
  stock_units: number;
  historical_6m_units: number[];
  expiry_date?: string | null;
  margin_pct?: number;
  days_since_last_order?: number;
}

const NBA_CONFIG = {
  recencyGapDays: 30,
  highMarginThreshold: 30,
  volumeDeclineThreshold: 20,
  expiryWindowDays: 45,
  weights: { recency: 35, margin: 25, volumeDecline: 20, expiry: 20 },
};

export function generateNextBestActions(
  products: NBAProductInput[],
  maxResults = 5
): NextBestAction[] {
  const actions: NextBestAction[] = [];

  for (const p of products) {
    if (p.stock_status === "out_of_stock" || p.stock_units <= 0) continue;

    let score = 0;
    let reason = "";
    let actionLabel = "";
    let provenance: NBAProvenance = "rule_high_margin";
    const context: NextBestAction["context"] = {};
    const marginPct = p.margin_pct ?? 35;
    context.marginPct = marginPct;

    const daysSince = p.days_since_last_order ?? 999;
    context.daysSinceLastOrder = daysSince;

    if (daysSince >= NBA_CONFIG.recencyGapDays) {
      const recencyScore = Math.min(100, (daysSince / 90) * 100);
      score += recencyScore * (NBA_CONFIG.weights.recency / 100);
      reason = `No order in ${daysSince} days (>${NBA_CONFIG.recencyGapDays}d threshold)`;
      actionLabel = "Re-order Pitch";
      provenance = "rule_recency_gap";
    }

    if (marginPct >= NBA_CONFIG.highMarginThreshold) {
      const marginScore = Math.min(100, (marginPct / 50) * 100);
      score += marginScore * (NBA_CONFIG.weights.margin / 100);
      if (!reason) {
        reason = `High-margin product (${marginPct}% margin)`;
        actionLabel = "Push High-Margin SKU";
        provenance = "rule_high_margin";
      } else {
        reason += ` + High margin (${marginPct}%)`;
      }
    }

    const h = p.historical_6m_units;
    if (h && h.length === 6) {
      const prior3M = h[0] + h[1] + h[2];
      const recent3M = h[3] + h[4] + h[5];
      if (prior3M > 0) {
        const dropPct = Math.round(((prior3M - recent3M) / prior3M) * 100);
        context.volumeDropPct = dropPct;
        if (dropPct >= NBA_CONFIG.volumeDeclineThreshold) {
          const declineScore = Math.min(100, (dropPct / 50) * 100);
          score += declineScore * (NBA_CONFIG.weights.volumeDecline / 100);
          if (!reason) {
            reason = `Volume declined ${dropPct}% over last 3 months`;
            actionLabel = "Recover Lost Volume";
            provenance = "rule_declining_volume";
          } else {
            reason += ` + Volume dropped ${dropPct}%`;
          }
        }
      }
    }

    if (p.expiry_date) {
      const daysUntilExpiry = Math.ceil(
        (new Date(p.expiry_date).getTime() - Date.now()) / (1000 * 3600 * 24)
      );
      context.daysUntilExpiry = daysUntilExpiry;
      if (daysUntilExpiry > 0 && daysUntilExpiry <= NBA_CONFIG.expiryWindowDays) {
        const expiryScore = Math.min(100, ((NBA_CONFIG.expiryWindowDays - daysUntilExpiry) / NBA_CONFIG.expiryWindowDays) * 100);
        score += expiryScore * (NBA_CONFIG.weights.expiry / 100);
        if (!reason) {
          reason = `Batch expiring in ${daysUntilExpiry} days — push clearance pricing`;
          actionLabel = "Expiry Clearance Push";
          provenance = "rule_expiry_push";
        } else {
          reason += ` + Expiry in ${daysUntilExpiry}d`;
        }
      }
    }

    if (score >= 10) {
      actions.push({
        id: `nba-${p.id}`,
        productId: p.id,
        productName: p.name,
        productSku: p.sku,
        score: Math.round(score),
        reason,
        actionLabel,
        provenance,
        context,
      });
    }
  }

  return actions.sort((a, b) => b.score - a.score).slice(0, maxResults);
}

export function getProvenanceLabel(provenance: NBAProvenance): { label: string; color: string; icon: string } {
  switch (provenance) {
    case "rule_recency_gap":
      return { label: "Rule: Recency Gap", color: "text-amber-700 bg-amber-50 border-amber-200", icon: "⏰" };
    case "rule_high_margin":
      return { label: "Rule: High Margin", color: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: "💰" };
    case "rule_declining_volume":
      return { label: "Rule: Volume Decline", color: "text-red-700 bg-red-50 border-red-200", icon: "📉" };
    case "rule_expiry_push":
      return { label: "Rule: Expiry Push", color: "text-orange-700 bg-orange-50 border-orange-200", icon: "⚠️" };
    case "ai_model_score":
      return { label: "AI Model Score", color: "text-violet-700 bg-violet-50 border-violet-200", icon: "🤖" };
  }
}


// ═══════════════════════════════════════════════════════════════
// 3. FORECAST ACCURACY TRACKING
// ═══════════════════════════════════════════════════════════════

export interface ForecastAccuracySnapshot {
  period: string;
  repId: string;
  repName: string;
  territory: string;
  forecastUnits: number;
  actualUnits: number;
  accuracyPct: number;
  variancePct: number;
  mape: number;
}

export interface RepForecastScorecard {
  repId: string;
  repName: string;
  territory: string;
  quarterlyAccuracy: ForecastAccuracySnapshot[];
  currentQuarter: ForecastAccuracySnapshot;
  overallAccuracyScore: number;
  rank: number;
  grade: "A" | "B" | "C" | "D";
}

export const FORECAST_ACCURACY_HISTORY: ForecastAccuracySnapshot[] = [
  { period: "2025-Q3", repId: "rep-rahul", repName: "Rahul Menon", territory: "Dubai", forecastUnits: 4200, actualUnits: 3780, accuracyPct: 90.0, variancePct: -10.0, mape: 10.0 },
  { period: "2025-Q4", repId: "rep-rahul", repName: "Rahul Menon", territory: "Dubai", forecastUnits: 4500, actualUnits: 4275, accuracyPct: 95.0, variancePct: -5.0, mape: 5.0 },
  { period: "2026-Q1", repId: "rep-rahul", repName: "Rahul Menon", territory: "Dubai", forecastUnits: 4800, actualUnits: 4560, accuracyPct: 95.0, variancePct: -5.0, mape: 5.0 },
  { period: "2026-Q2", repId: "rep-rahul", repName: "Rahul Menon", territory: "Dubai", forecastUnits: 5100, actualUnits: 4845, accuracyPct: 95.0, variancePct: -5.0, mape: 5.0 },

  { period: "2025-Q3", repId: "rep-sarah", repName: "Sarah Jenkins", territory: "Abu Dhabi", forecastUnits: 3800, actualUnits: 3230, accuracyPct: 85.0, variancePct: -15.0, mape: 15.0 },
  { period: "2025-Q4", repId: "rep-sarah", repName: "Sarah Jenkins", territory: "Abu Dhabi", forecastUnits: 3600, actualUnits: 3240, accuracyPct: 90.0, variancePct: -10.0, mape: 10.0 },
  { period: "2026-Q1", repId: "rep-sarah", repName: "Sarah Jenkins", territory: "Abu Dhabi", forecastUnits: 3900, actualUnits: 3510, accuracyPct: 90.0, variancePct: -10.0, mape: 10.0 },
  { period: "2026-Q2", repId: "rep-sarah", repName: "Sarah Jenkins", territory: "Abu Dhabi", forecastUnits: 4100, actualUnits: 3690, accuracyPct: 90.0, variancePct: -10.0, mape: 10.0 },

  { period: "2025-Q3", repId: "rep-tariq", repName: "Tariq Mansoor", territory: "Sharjah & NE", forecastUnits: 2800, actualUnits: 2380, accuracyPct: 85.0, variancePct: -15.0, mape: 15.0 },
  { period: "2025-Q4", repId: "rep-tariq", repName: "Tariq Mansoor", territory: "Sharjah & NE", forecastUnits: 3000, actualUnits: 2400, accuracyPct: 80.0, variancePct: -20.0, mape: 20.0 },
  { period: "2026-Q1", repId: "rep-tariq", repName: "Tariq Mansoor", territory: "Sharjah & NE", forecastUnits: 3200, actualUnits: 2720, accuracyPct: 85.0, variancePct: -15.0, mape: 15.0 },
  { period: "2026-Q2", repId: "rep-tariq", repName: "Tariq Mansoor", territory: "Sharjah & NE", forecastUnits: 3400, actualUnits: 2890, accuracyPct: 85.0, variancePct: -15.0, mape: 15.0 },

  { period: "2025-Q3", repId: "rep-ahmed", repName: "Ahmed Al-Rashid", territory: "Western Region", forecastUnits: 2200, actualUnits: 2068, accuracyPct: 94.0, variancePct: -6.0, mape: 6.0 },
  { period: "2025-Q4", repId: "rep-ahmed", repName: "Ahmed Al-Rashid", territory: "Western Region", forecastUnits: 2400, actualUnits: 2280, accuracyPct: 95.0, variancePct: -5.0, mape: 5.0 },
  { period: "2026-Q1", repId: "rep-ahmed", repName: "Ahmed Al-Rashid", territory: "Western Region", forecastUnits: 2600, actualUnits: 2470, accuracyPct: 95.0, variancePct: -5.0, mape: 5.0 },
  { period: "2026-Q2", repId: "rep-ahmed", repName: "Ahmed Al-Rashid", territory: "Western Region", forecastUnits: 2800, actualUnits: 2660, accuracyPct: 95.0, variancePct: -5.0, mape: 5.0 },
];

export function buildForecastScorecards(): RepForecastScorecard[] {
  const repIds = [...new Set(FORECAST_ACCURACY_HISTORY.map((s) => s.repId))];
  const scorecards: RepForecastScorecard[] = repIds.map((repId) => {
    const snapshots = FORECAST_ACCURACY_HISTORY.filter((s) => s.repId === repId).sort(
      (a, b) => a.period.localeCompare(b.period)
    );
    const latest = snapshots[snapshots.length - 1];
    const avgAccuracy = snapshots.reduce((sum, s) => sum + s.accuracyPct, 0) / snapshots.length;
    let grade: "A" | "B" | "C" | "D" = "D";
    if (avgAccuracy >= 93) grade = "A";
    else if (avgAccuracy >= 88) grade = "B";
    else if (avgAccuracy >= 82) grade = "C";
    return {
      repId, repName: latest.repName, territory: latest.territory,
      quarterlyAccuracy: snapshots, currentQuarter: latest,
      overallAccuracyScore: Math.round(avgAccuracy), rank: 0, grade,
    };
  });
  scorecards.sort((a, b) => b.overallAccuracyScore - a.overallAccuracyScore);
  scorecards.forEach((sc, i) => (sc.rank = i + 1));
  return scorecards;
}
