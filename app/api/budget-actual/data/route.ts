import { NextResponse } from "next/server";
import { pool } from "@/lib/supabase/localDb";

export const dynamic = "force-dynamic";

function getCategoryTag(category: string): "Egg" | "Ing" | "FG" {
  const cat = (category || "").toLowerCase();
  if (cat.includes("egg")) return "Egg";
  if (
    cat.includes("flour") ||
    cat.includes("grain") ||
    cat.includes("sourdough") ||
    cat.includes("yeast") ||
    cat.includes("bakery mix")
  ) {
    return "Ing";
  }
  return "FG";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const selectedRepId = searchParams.get("repId");
    const selectedTerritory = searchParams.get("territory");

    // 1. Fetch Sales Reps
    const repsRes = await pool.query(`
      SELECT id, full_name, email, role FROM users WHERE role = 'sales_rep' ORDER BY full_name ASC
    `);
    const reps = repsRes.rows;

    // 2. Fetch Customers with Account Owner
    const custsRes = await pool.query(`
      SELECT 
        c.id, c.name, c.territory, c.country, c.address, 
        c.contact_name, c.contact_phone, c.contact_email,
        c.open_items_amount, c.account_owner_id,
        u.full_name as owner_name
      FROM customers c
      LEFT JOIN users u ON c.account_owner_id = u.id
      ORDER BY c.name ASC
    `);
    const customers = custsRes.rows;

    // 3. Fetch Products
    const prodsRes = await pool.query(`
      SELECT id, sku, name, category, base_price, description FROM products ORDER BY name ASC
    `);
    const products = prodsRes.rows;

    // 4. Fetch Actuals from purchase_history
    const actualsRes = await pool.query(`
      SELECT 
        customer_id, 
        product_id, 
        SUM(quantity) as actual_qty, 
        SUM(amount) as actual_amount
      FROM purchase_history
      GROUP BY customer_id, product_id
    `);
    const actualsMap = new Map<string, { actual_qty: number; actual_amount: number }>();
    actualsRes.rows.forEach((r) => {
      actualsMap.set(`${r.customer_id}_${r.product_id}`, {
        actual_qty: parseFloat(r.actual_qty) || 0,
        actual_amount: parseFloat(r.actual_amount) || 0,
      });
    });

    // 5. Fetch Budgets
    const budgetsRes = await pool.query(`
      SELECT customer_id, product_id, budget_qty, budget_amount
      FROM customer_product_budgets
      WHERE budget_year = 2026
    `);
    const budgetsMap = new Map<string, { budget_qty: number; budget_amount: number }>();
    budgetsRes.rows.forEach((r) => {
      budgetsMap.set(`${r.customer_id}_${r.product_id}`, {
        budget_qty: parseFloat(r.budget_qty) || 0,
        budget_amount: parseFloat(r.budget_amount) || 0,
      });
    });

    // 6. Build Detailed Customer Records with Line Items
    const detailedCustomers = customers.map((c, idx) => {
      let custActualSales = 0;
      let custBudgetSales = 0;
      let custActualMargin = 0;
      let custBudgetMargin = 0;

      const items = products.map((p) => {
        const key = `${c.id}_${p.id}`;
        const actual = actualsMap.get(key) || { actual_qty: 0, actual_amount: 0 };
        const budget = budgetsMap.get(key) || {
          budget_qty: Math.round(actual.actual_qty * 1.15),
          budget_amount: Math.round(actual.actual_amount * 1.15),
        };

        const tag = getCategoryTag(p.category);
        const marginRate = tag === "FG" ? 0.35 : tag === "Ing" ? 0.30 : 0.28;
        const actualMargin = actual.actual_amount * marginRate;
        const budgetMargin = budget.budget_amount * marginRate;

        custActualSales += actual.actual_amount;
        custBudgetSales += budget.budget_amount;
        custActualMargin += actualMargin;
        custBudgetMargin += budgetMargin;

        return {
          sku: p.sku || `SKU-${p.id.slice(0, 6)}`,
          name: p.name,
          item_category: p.category,
          category_tag: tag,
          item_packaging: p.name.includes("kg") ? p.name.split(" ").slice(-1)[0] : "Unit Pack",
          budget_qty_2026: budget.budget_qty,
          actual_qty_2026: actual.actual_qty,
          sales_2025_actual: Math.round(budget.budget_amount * 0.88),
          sales_2026_budget: budget.budget_amount,
          sales_2026_actual: actual.actual_amount,
          margin_2026_budget: Math.round(budgetMargin),
          margin_2026_actual: Math.round(actualMargin),
        };
      }).filter((item) => item.sales_2026_budget > 0 || item.sales_2026_actual > 0);

      const openAR = parseFloat(c.open_items_amount) || Math.round(custActualSales * 0.18);
      const creditLimit = Math.max(150000, Math.round(custBudgetSales * 0.4));

      return {
        id: c.id,
        customer_code: `CUST-${String(idx + 1).padStart(4, "0")}`,
        customer_name: c.name,
        customer_country: c.country || "UAE",
        customer_city: c.territory?.includes("Dubai") ? "Dubai" : c.territory?.includes("Abu") ? "Abu Dhabi" : "Sharjah",
        customer_category: c.name.includes("Hypermarket") || c.name.includes("Supermarket") ? "Modern Trade Supermarkets" : "Artisan Bakeries & Patisseries",
        station: c.territory || "Dubai Central Hub",
        sales_exec_id: c.account_owner_id,
        sales_exec_name: c.owner_name || "Rahul Menon",
        credit_period_days: 45,
        approved_credit_limit: creditLimit,
        net_receivables_ar: openAR,
        due_post_credit_period: Math.round(openAR * 0.15),
        due_exceeding_approved_limit: 0,
        days_post_credit_period: idx % 3 === 0 ? 12 : -5,
        sales_2026_budget: custBudgetSales,
        sales_2026_actual: custActualSales,
        margin_2026_actual: custActualMargin,
        items,
      };
    });

    // 7. Build Sales Rep Performance Data
    const repPerformance = reps.map((rep) => {
      const repCustomers = detailedCustomers.filter((c) => c.sales_exec_id === rep.id);
      const budgetTotal = repCustomers.reduce((s, c) => s + c.sales_2026_budget, 0);
      const actualTotal = repCustomers.reduce((s, c) => s + c.sales_2026_actual, 0);
      const marginTotal = repCustomers.reduce((s, c) => s + c.margin_2026_actual, 0);
      const arTotal = repCustomers.reduce((s, c) => s + c.net_receivables_ar, 0);
      const achievedPct = budgetTotal > 0 ? (actualTotal / budgetTotal) * 100 : 0;

      const topCust = repCustomers.length > 0 ? repCustomers.sort((a, b) => b.sales_2026_actual - a.sales_2026_actual)[0]?.customer_name : "General Accounts";
      const territory = repCustomers[0]?.station || "UAE Multi-Territory";

      return {
        id: rep.id,
        rep_name: rep.full_name,
        email: rep.email,
        territory,
        account_count: repCustomers.length,
        sales_2026_budget: budgetTotal,
        sales_2026_actual: actualTotal,
        margin_2026_actual: marginTotal,
        net_receivables_ar: arTotal,
        achieved_pct: Math.round(achievedPct * 10) / 10,
        top_customer: topCust,
        top_category: "Gourmet Ingredients & Mixes",
      };
    });

    // 8. Build SKU Matrix Performance Data
    const skuMatrix = products.map((p) => {
      let totalActualQty = 0;
      let totalActualAmount = 0;
      let totalBudgetQty = 0;
      let totalBudgetAmount = 0;

      detailedCustomers.forEach((c) => {
        const itm = c.items.find((i) => i.name === p.name);
        if (itm) {
          totalActualQty += itm.actual_qty_2026;
          totalActualAmount += itm.sales_2026_actual;
          totalBudgetQty += itm.budget_qty_2026;
          totalBudgetAmount += itm.sales_2026_budget;
        }
      });

      const tag = getCategoryTag(p.category);
      const marginRate = tag === "FG" ? 0.35 : tag === "Ing" ? 0.30 : 0.28;
      const marginAmount = totalActualAmount * marginRate;

      return {
        id: p.id,
        sku: p.sku || `SKU-${p.id.slice(0, 6)}`,
        name: p.name,
        category_name: p.category,
        category_tag: tag,
        item_packaging: p.name.includes("kg") ? p.name.split(" ").slice(-1)[0] : "Unit Pack",
        budget_qty_2026: totalBudgetQty,
        actual_qty_2026: totalActualQty,
        sales_2025_actual: Math.round(totalBudgetAmount * 0.88),
        sales_2026_budget: totalBudgetAmount,
        sales_2026_actual: totalActualAmount,
        margin_2026_budget: Math.round(totalBudgetAmount * marginRate),
        margin_2026_actual: Math.round(marginAmount),
      };
    }).filter((s) => s.sales_2026_budget > 0 || s.sales_2026_actual > 0);

    // 9. Categories Breakdown
    const calcCat = (tag: "Egg" | "Ing" | "FG") => {
      const items = skuMatrix.filter((i) => i.category_tag === tag);
      const actualSales = items.reduce((s, i) => s + i.sales_2026_actual, 0);
      const budgetSales = items.reduce((s, i) => s + i.sales_2026_budget, 0);
      const actualMargin = items.reduce((s, i) => s + i.margin_2026_actual, 0);
      const budgetMargin = items.reduce((s, i) => s + i.margin_2026_budget, 0);
      const achievedPct = budgetSales > 0 ? (actualSales / budgetSales) * 100 : 0;
      return { actualSales, budgetSales, actualMargin, budgetMargin, achievedPct };
    };

    const egg = calcCat("Egg");
    const ing = calcCat("Ing");
    const fg = calcCat("FG");

    const totalBudgetSales = skuMatrix.reduce((s, i) => s + i.sales_2026_budget, 0);
    const totalActualSales = skuMatrix.reduce((s, i) => s + i.sales_2026_actual, 0);
    const totalActualMargin = skuMatrix.reduce((s, i) => s + i.margin_2026_actual, 0);
    const totalBudgetMargin = skuMatrix.reduce((s, i) => s + i.margin_2026_budget, 0);
    const totalAR = detailedCustomers.reduce((s, c) => s + c.net_receivables_ar, 0);

    return NextResponse.json({
      success: true,
      reps: repPerformance,
      customers: detailedCustomers,
      skus: skuMatrix,
      categories: {
        egg,
        ing,
        fg,
      },
      totals: {
        totalBudgetSales,
        totalActualSales,
        totalActualMargin,
        totalBudgetMargin,
        totalAR,
        salesAchievedPct: totalBudgetSales > 0 ? (totalActualSales / totalBudgetSales) * 100 : 0,
      },
    });
  } catch (error: any) {
    console.error("Budget vs Actual data API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
