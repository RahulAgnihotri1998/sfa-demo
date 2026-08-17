export type CategoryTag = "Egg" | "Ing" | "FG";

export interface SkuMasterItem {
  id: string;
  sku: string;
  name: string;
  category_tag: CategoryTag;
  category_name: string;
  item_packaging: string;
  unit_price: number;
  unit_cogs: number; // Cost of goods sold
  uom: string;
}

export interface CustomerCategoryItem {
  id: string;
  category_name: string;
  customer_count: number;
  sales_2025_actual: number;
  sales_2026_budget: number;
  sales_2026_actual: number;
  margin_2026_budget: number;
  margin_2026_actual: number;
  net_receivables_ar: number; // Net open AR from Sage X3
  top_customer: string;
  top_sku: string;
}

export interface SkuBudgetItem {
  sku: string;
  name: string;
  category_tag: CategoryTag;
  category_name: string;
  item_packaging: string;
  budget_qty_2026: number;
  actual_qty_2026: number;
  sales_2025_actual: number;
  sales_2026_budget: number;
  sales_2026_actual: number;
  cogs_2026_actual: number;
  margin_2026_budget: number;
  margin_2026_actual: number;
  unit_price: number;
  unit_cogs: number;
}

export interface CustomerSkuBudgetItem {
  sku: string;
  name: string;
  item_category: string;
  category_tag: CategoryTag;
  item_packaging: string;
  budget_qty_2026: number;
  actual_qty_2026: number;
  sales_2025_actual: number;
  sales_2026_budget: number;
  sales_2026_actual: number;
  margin_2026_budget: number;
  margin_2026_actual: number;
}

export interface CustomerDetailRecord {
  id: string;
  customer_code: string; // e.g. E0000176
  customer_name: string;
  customer_country: string;
  customer_city: string;
  customer_category: string;
  station: string;
  sales_exec_name: string;
  credit_period_days: number;
  approved_credit_limit: number;
  net_receivables_ar: number;
  due_post_credit_period: number;
  due_exceeding_approved_limit: number;
  days_post_credit_period: number; // Negative = within terms (e.g. -7), Positive = overdue (e.g. +14)
  items: CustomerSkuBudgetItem[];
}

export interface MonthlyTrendItem {
  month: string;
  sales_2025: number;
  budget_2026: number;
  actual_2026: number;
}

// 1. SKU Master Reference Data with Category Tags (Egg / Ing / FG)
export const SKU_MASTER_DATA: SkuMasterItem[] = [
  // Egg Category
  { id: "sku-egg-01", sku: "OV-100-01", name: "Pasteurized Liquid Whole Egg 10kg", category_tag: "Egg", category_name: "Liquid & Powder Egg", item_packaging: "10kg Bag-in-Box", unit_price: 135, unit_cogs: 98, uom: "BIB" },
  { id: "sku-egg-02", sku: "OV-100-02", name: "Pasteurized Liquid Egg White (Albumen) 10kg", category_tag: "Egg", category_name: "Liquid & Powder Egg", item_packaging: "10kg Bag-in-Box", unit_price: 155, unit_cogs: 110, uom: "BIB" },
  { id: "sku-egg-03", sku: "OV-100-03", name: "Pasteurized Liquid Egg Yolk 10kg", category_tag: "Egg", category_name: "Liquid & Powder Egg", item_packaging: "10kg Bag-in-Box", unit_price: 185, unit_cogs: 132, uom: "BIB" },
  { id: "sku-egg-04", sku: "OV-200-04", name: "High-Whip Dried Egg White Powder 20kg", category_tag: "Egg", category_name: "Liquid & Powder Egg", item_packaging: "20kg Multi-wall Bag", unit_price: 420, unit_cogs: 295, uom: "BAG" },

  // Ingredient (Ing) Category
  { id: "sku-ing-01", sku: "SCH-630-01", name: "Spelt Flour Type 630 25kg", category_tag: "Ing", category_name: "Specialty Flour & Grains", item_packaging: "25kg Paper Bag", unit_price: 145, unit_cogs: 102, uom: "BAG" },
  { id: "sku-ing-02", sku: "SCH-405-02", name: "Wheat Flour – Type 405 25kg", category_tag: "Ing", category_name: "Specialty Flour & Grains", item_packaging: "25kg Paper Bag", unit_price: 120, unit_cogs: 84, uom: "BAG" },
  { id: "sku-ing-03", sku: "LES-100-01", name: "AROME LEVAIN® Liquid Formula 10kg", category_tag: "Ing", category_name: "Sourdough & Yeast", item_packaging: "10kg Canister", unit_price: 215, unit_cogs: 148, uom: "BOX" },
  { id: "sku-ing-04", sku: "LES-500-02", name: "Livendo 2in1 Rustic Sourdough 5kg", category_tag: "Ing", category_name: "Sourdough & Yeast", item_packaging: "5kg Foil Bag", unit_price: 135, unit_cogs: 92, uom: "BAG" },
  { id: "sku-ing-05", sku: "DOB-250-01", name: "Neropan Bread Darkener 25kg", category_tag: "Ing", category_name: "Sourdough & Yeast", item_packaging: "25kg Paper Bag", unit_price: 155, unit_cogs: 108, uom: "BAG" },
  { id: "sku-ing-06", sku: "CSM-250-01", name: "BOS Special Bakery Mix 25kg", category_tag: "Ing", category_name: "Bakery Mixes", item_packaging: "25kg Sack", unit_price: 165, unit_cogs: 115, uom: "BAG" },
  { id: "sku-ing-07", sku: "DW-100-03", name: "Vegan Muffin Mix – Chocolate 10kg", category_tag: "Ing", category_name: "Bakery Mixes", item_packaging: "10kg Bag", unit_price: 140, unit_cogs: 95, uom: "BAG" },

  // Finished Goods (FG) Category
  { id: "sku-fg-01", sku: "FB-950-01", name: "Amarena Fabbri Gourmet Sauce 950g", category_tag: "FG", category_name: "Gourmet Sauces & Flavours", item_packaging: "950g Squeeze Bottle (6/cs)", unit_price: 85, unit_cogs: 52, uom: "BOTTLE" },
  { id: "sku-fg-02", sku: "FB-150-03", name: "Delipaste – Salted Butter Caramel 1.5kg", category_tag: "FG", category_name: "Gourmet Sauces & Flavours", item_packaging: "1.5kg Tin (2/cs)", unit_price: 175, unit_cogs: 112, uom: "TIN" },
  { id: "sku-fg-03", sku: "DW-130-01", name: "Confibel Apricot Jam 13kg Pail", category_tag: "FG", category_name: "Fruit Jams & Pastes", item_packaging: "13kg Industrial Pail", unit_price: 195, unit_cogs: 128, uom: "PAIL" },
  { id: "sku-fg-04", sku: "DW-600-02", name: "Chocolate Frosting 6kg Pail", category_tag: "FG", category_name: "Bakery Mixes & Frostings", item_packaging: "6kg Plastic Tub", unit_price: 155, unit_cogs: 98, uom: "PAIL" },
  { id: "sku-fg-05", sku: "15000068", name: "Bolivia Lait de terroir 45% Couverture 6kg", category_tag: "FG", category_name: "Couverture & Chocolate", item_packaging: "6kg Block / Carton", unit_price: 320, unit_cogs: 215, uom: "CTN" },
  { id: "sku-fg-06", sku: "FB-400-05", name: "Nutty Wow Dark Chocolate Marbling 4kg", category_tag: "FG", category_name: "Gourmet Sauces & Flavours", item_packaging: "4kg Tub", unit_price: 260, unit_cogs: 170, uom: "PAIL" },
];

// 2. Customer Category Breakdown with Receivables
export const CUSTOMER_CATEGORIES_DATA: CustomerCategoryItem[] = [
  {
    id: "cat-modern-trade",
    category_name: "Modern Trade Supermarkets",
    customer_count: 24,
    sales_2025_actual: 1420000,
    sales_2026_budget: 1680000,
    sales_2026_actual: 1545000,
    margin_2026_budget: 537600, // 32%
    margin_2026_actual: 509850, // 33%
    net_receivables_ar: 184500,
    top_customer: "Spinneys Dubai LLC",
    top_sku: "Amarena Fabbri Gourmet Sauce 950g",
  },
  {
    id: "cat-artisan-bakery",
    category_name: "Artisan Bakeries & Patisseries",
    customer_count: 42,
    sales_2025_actual: 1850000,
    sales_2026_budget: 2150000,
    sales_2026_actual: 2012000,
    margin_2026_budget: 752500, // 35%
    margin_2026_actual: 724320, // 36%
    net_receivables_ar: 242000,
    top_customer: "Paul Bakery & Restaurant UAE",
    top_sku: "Spelt Flour Type 630 25kg",
  },
  {
    id: "cat-horeca-hotels",
    category_name: "HORECA & Luxury Hotels",
    customer_count: 31,
    sales_2025_actual: 2280000,
    sales_2026_budget: 2650000,
    sales_2026_actual: 2510000,
    margin_2026_budget: 954000, // 36%
    margin_2026_actual: 928700, // 37%
    net_receivables_ar: 318000,
    top_customer: "Atlantis The Royal Palm",
    top_sku: "Bolivia Couverture 45% 6kg",
  },
  {
    id: "cat-wholesale",
    category_name: "Wholesale & Food Service",
    customer_count: 18,
    sales_2025_actual: 3100000,
    sales_2026_budget: 3500000,
    sales_2026_actual: 3240000,
    margin_2026_budget: 875000, // 25%
    margin_2026_actual: 842400, // 26%
    net_receivables_ar: 425000,
    top_customer: "Master Foodservice Distributors",
    top_sku: "Pasteurized Liquid Whole Egg 10kg",
  },
  {
    id: "cat-cafe-chains",
    category_name: "Quick Service & Cafe Chains",
    customer_count: 15,
    sales_2025_actual: 980000,
    sales_2026_budget: 1200000,
    sales_2026_actual: 1125000,
    margin_2026_budget: 420000, // 35%
    margin_2026_actual: 405000, // 36%
    net_receivables_ar: 98000,
    top_customer: "Tim Hortons UAE",
    top_sku: "Delipaste Salted Caramel 1.5kg",
  },
];

// 3. Granular SKU-Level Budget vs Actual Dataset (2025 & 2026)
export const SKU_BUDGET_ACTUAL_DATA: SkuBudgetItem[] = [
  // Egg SKUs
  {
    sku: "OV-100-01",
    name: "Pasteurized Liquid Whole Egg 10kg",
    category_tag: "Egg",
    category_name: "Liquid & Powder Egg",
    item_packaging: "10kg Bag-in-Box",
    budget_qty_2026: 8200,
    actual_qty_2026: 7650,
    sales_2025_actual: 945000,
    sales_2026_budget: 1107000,
    sales_2026_actual: 1032750,
    cogs_2026_actual: 749700,
    margin_2026_budget: 303400,
    margin_2026_actual: 283050,
    unit_price: 135,
    unit_cogs: 98,
  },
  {
    sku: "OV-100-02",
    name: "Pasteurized Liquid Egg White 10kg",
    category_tag: "Egg",
    category_name: "Liquid & Powder Egg",
    item_packaging: "10kg Bag-in-Box",
    budget_qty_2026: 4500,
    actual_qty_2026: 4180,
    sales_2025_actual: 580000,
    sales_2026_budget: 697500,
    sales_2026_actual: 647900,
    cogs_2026_actual: 459800,
    margin_2026_budget: 202500,
    margin_2026_actual: 188100,
    unit_price: 155,
    unit_cogs: 110,
  },
  {
    sku: "OV-100-03",
    name: "Pasteurized Liquid Egg Yolk 10kg",
    category_tag: "Egg",
    category_name: "Liquid & Powder Egg",
    item_packaging: "10kg Bag-in-Box",
    budget_qty_2026: 3200,
    actual_qty_2026: 3050,
    sales_2025_actual: 495000,
    sales_2026_budget: 592000,
    sales_2026_actual: 564250,
    cogs_2026_actual: 402600,
    margin_2026_budget: 169600,
    margin_2026_actual: 161650,
    unit_price: 185,
    unit_cogs: 132,
  },
  {
    sku: "OV-200-04",
    name: "High-Whip Dried Egg White Powder 20kg",
    category_tag: "Egg",
    category_name: "Liquid & Powder Egg",
    item_packaging: "20kg Multi-wall Bag",
    budget_qty_2026: 950,
    actual_qty_2026: 880,
    sales_2025_actual: 340000,
    sales_2026_budget: 399000,
    sales_2026_actual: 369600,
    cogs_2026_actual: 259600,
    margin_2026_budget: 118750,
    margin_2026_actual: 110000,
    unit_price: 420,
    unit_cogs: 295,
  },

  // Ingredient (Ing) SKUs
  {
    sku: "SCH-630-01",
    name: "Spelt Flour Type 630 25kg",
    category_tag: "Ing",
    category_name: "Specialty Flour & Grains",
    item_packaging: "25kg Paper Bag",
    budget_qty_2026: 6200,
    actual_qty_2026: 5850,
    sales_2025_actual: 760000,
    sales_2026_budget: 899000,
    sales_2026_actual: 848250,
    cogs_2026_actual: 596700,
    margin_2026_budget: 266600,
    margin_2026_actual: 251550,
    unit_price: 145,
    unit_cogs: 102,
  },
  {
    sku: "SCH-405-02",
    name: "Wheat Flour – Type 405 25kg",
    category_tag: "Ing",
    category_name: "Specialty Flour & Grains",
    item_packaging: "25kg Paper Bag",
    budget_qty_2026: 9800,
    actual_qty_2026: 9200,
    sales_2025_actual: 990000,
    sales_2026_budget: 1176000,
    sales_2026_actual: 1104000,
    cogs_2026_actual: 772800,
    margin_2026_budget: 352800,
    margin_2026_actual: 331200,
    unit_price: 120,
    unit_cogs: 84,
  },
  {
    sku: "LES-100-01",
    name: "AROME LEVAIN® Liquid Formula 10kg",
    category_tag: "Ing",
    category_name: "Sourdough & Yeast",
    item_packaging: "10kg Canister",
    budget_qty_2026: 3100,
    actual_qty_2026: 2920,
    sales_2025_actual: 560000,
    sales_2026_budget: 666500,
    sales_2026_actual: 627800,
    cogs_2026_actual: 432160,
    margin_2026_budget: 207700,
    margin_2026_actual: 195640,
    unit_price: 215,
    unit_cogs: 148,
  },
  {
    sku: "LES-500-02",
    name: "Livendo 2in1 Rustic Sourdough 5kg",
    category_tag: "Ing",
    category_name: "Sourdough & Yeast",
    item_packaging: "5kg Foil Bag",
    budget_qty_2026: 4200,
    actual_qty_2026: 3950,
    sales_2025_actual: 480000,
    sales_2026_budget: 567000,
    sales_2026_actual: 533250,
    cogs_2026_actual: 363400,
    margin_2026_budget: 180600,
    margin_2026_actual: 169850,
    unit_price: 135,
    unit_cogs: 92,
  },

  // Finished Goods (FG) SKUs
  {
    sku: "FB-950-01",
    name: "Amarena Fabbri Gourmet Sauce 950g",
    category_tag: "FG",
    category_name: "Gourmet Sauces & Flavours",
    item_packaging: "950g Squeeze Bottle",
    budget_qty_2026: 12500,
    actual_qty_2026: 11950,
    sales_2025_actual: 910000,
    sales_2026_budget: 1062500,
    sales_2026_actual: 1015750,
    cogs_2026_actual: 621400,
    margin_2026_budget: 412500,
    margin_2026_actual: 394350,
    unit_price: 85,
    unit_cogs: 52,
  },
  {
    sku: "FB-150-03",
    name: "Delipaste – Salted Butter Caramel 1.5kg",
    category_tag: "FG",
    category_name: "Gourmet Sauces & Flavours",
    item_packaging: "1.5kg Tin",
    budget_qty_2026: 4800,
    actual_qty_2026: 4560,
    sales_2025_actual: 710000,
    sales_2026_budget: 840000,
    sales_2026_actual: 798000,
    cogs_2026_actual: 510720,
    margin_2026_budget: 302400,
    margin_2026_actual: 287280,
    unit_price: 175,
    unit_cogs: 112,
  },
  {
    sku: "15000068",
    name: "Bolivia Lait de terroir 45% Couverture 6kg",
    category_tag: "FG",
    category_name: "Couverture & Chocolate",
    item_packaging: "6kg Block",
    budget_qty_2026: 3800,
    actual_qty_2026: 3620,
    sales_2025_actual: 1020000,
    sales_2026_budget: 1216000,
    sales_2026_actual: 1158400,
    cogs_2026_actual: 778300,
    margin_2026_budget: 399000,
    margin_2026_actual: 380100,
    unit_price: 320,
    unit_cogs: 215,
  },
  {
    sku: "DW-130-01",
    name: "Confibel Apricot Jam 13kg Pail",
    category_tag: "FG",
    category_name: "Fruit Jams & Pastes",
    item_packaging: "13kg Industrial Pail",
    budget_qty_2026: 3600,
    actual_qty_2026: 3350,
    sales_2025_actual: 590000,
    sales_2026_budget: 702000,
    sales_2026_actual: 653250,
    cogs_2026_actual: 428800,
    margin_2026_budget: 241200,
    margin_2026_actual: 224450,
    unit_price: 195,
    unit_cogs: 128,
  }
];

// 4. Detailed Customer Master & Customer-Specific SKU Level Data
export const CUSTOMER_DETAIL_RECORDS: CustomerDetailRecord[] = [
  {
    id: "cust-spinneys",
    customer_code: "E0000176",
    customer_name: "Spinneys Dubai LLC",
    customer_country: "United Arab Emirates",
    customer_city: "Dubai",
    customer_category: "Modern Trade Supermarkets",
    station: "Dubai Central Hub (DXB-01)",
    sales_exec_name: "Rahul Agnihotri",
    credit_period_days: 60,
    approved_credit_limit: 250000,
    net_receivables_ar: 184500,
    due_post_credit_period: 0,
    due_exceeding_approved_limit: 0,
    days_post_credit_period: -7, // -7 days (within approved credit terms)
    items: [
      {
        sku: "FB-950-01",
        name: "Amarena Fabbri Gourmet Sauce 950g",
        item_category: "Gourmet Sauces & Flavours",
        category_tag: "FG",
        item_packaging: "950g Squeeze Bottle",
        budget_qty_2026: 4200,
        actual_qty_2026: 3950,
        sales_2025_actual: 310000,
        sales_2026_budget: 357000,
        sales_2026_actual: 335750,
        margin_2026_budget: 138600,
        margin_2026_actual: 130350,
      },
      {
        sku: "15000068",
        name: "Bolivia Lait de terroir 45% Couverture 6kg",
        item_category: "Couverture & Chocolate",
        category_tag: "FG",
        item_packaging: "6kg Block",
        budget_qty_2026: 1200,
        actual_qty_2026: 1140,
        sales_2025_actual: 345000,
        sales_2026_budget: 384000,
        sales_2026_actual: 364800,
        margin_2026_budget: 126000,
        margin_2026_actual: 119700,
      },
      {
        sku: "SCH-630-01",
        name: "Spelt Flour Type 630 25kg",
        item_category: "Specialty Flour & Grains",
        category_tag: "Ing",
        item_packaging: "25kg Paper Bag",
        budget_qty_2026: 1800,
        actual_qty_2026: 1720,
        sales_2025_actual: 220000,
        sales_2026_budget: 261000,
        sales_2026_actual: 249400,
        margin_2026_budget: 77400,
        margin_2026_actual: 73960,
      },
      {
        sku: "OV-100-02",
        name: "Pasteurized Liquid Egg White 10kg",
        item_category: "Liquid & Powder Egg",
        category_tag: "Egg",
        item_packaging: "10kg Bag-in-Box",
        budget_qty_2026: 1500,
        actual_qty_2026: 1390,
        sales_2025_actual: 195000,
        sales_2026_budget: 232500,
        sales_2026_actual: 215450,
        margin_2026_budget: 67500,
        margin_2026_actual: 62550,
      },
    ],
  },
  {
    id: "cust-paul",
    customer_code: "E0000214",
    customer_name: "Paul Bakery & Restaurant UAE",
    customer_country: "United Arab Emirates",
    customer_city: "Dubai",
    customer_category: "Artisan Bakeries & Patisseries",
    station: "Downtown / Dubai Mall Hub (DXB-04)",
    sales_exec_name: "Ahmed Al-Mansoor",
    credit_period_days: 45,
    approved_credit_limit: 300000,
    net_receivables_ar: 242000,
    due_post_credit_period: 38000,
    due_exceeding_approved_limit: 0,
    days_post_credit_period: 5, // +5 days overdue
    items: [
      {
        sku: "SCH-630-01",
        name: "Spelt Flour Type 630 25kg",
        item_category: "Specialty Flour & Grains",
        category_tag: "Ing",
        item_packaging: "25kg Paper Bag",
        budget_qty_2026: 2800,
        actual_qty_2026: 2650,
        sales_2025_actual: 350000,
        sales_2026_budget: 406000,
        sales_2026_actual: 384250,
        margin_2026_budget: 120400,
        margin_2026_actual: 113950,
      },
      {
        sku: "LES-100-01",
        name: "AROME LEVAIN® Liquid Formula 10kg",
        item_category: "Sourdough & Yeast",
        category_tag: "Ing",
        item_packaging: "10kg Canister",
        budget_qty_2026: 1400,
        actual_qty_2026: 1320,
        sales_2025_actual: 255000,
        sales_2026_budget: 301000,
        sales_2026_actual: 283800,
        margin_2026_budget: 93800,
        margin_2026_actual: 88440,
      },
      {
        sku: "OV-100-01",
        name: "Pasteurized Liquid Whole Egg 10kg",
        item_category: "Liquid & Powder Egg",
        category_tag: "Egg",
        item_packaging: "10kg Bag-in-Box",
        budget_qty_2026: 2400,
        actual_qty_2026: 2280,
        sales_2025_actual: 280000,
        sales_2026_budget: 324000,
        sales_2026_actual: 307800,
        margin_2026_budget: 88800,
        margin_2026_actual: 84360,
      },
      {
        sku: "DW-130-01",
        name: "Confibel Apricot Jam 13kg Pail",
        item_category: "Fruit Jams & Pastes",
        category_tag: "FG",
        item_packaging: "13kg Industrial Pail",
        budget_qty_2026: 1100,
        actual_qty_2026: 1040,
        sales_2025_actual: 180000,
        sales_2026_budget: 214500,
        sales_2026_actual: 202800,
        margin_2026_budget: 73700,
        margin_2026_actual: 69680,
      },
    ],
  },
  {
    id: "cust-atlantis",
    customer_code: "E0000305",
    customer_name: "Atlantis The Royal Palm",
    customer_country: "United Arab Emirates",
    customer_city: "Dubai",
    customer_category: "HORECA & Luxury Hotels",
    station: "Palm Jumeirah Resort Station (DXB-08)",
    sales_exec_name: "Sarah Jenkins",
    credit_period_days: 90,
    approved_credit_limit: 450000,
    net_receivables_ar: 318000,
    due_post_credit_period: 0,
    due_exceeding_approved_limit: 0,
    days_post_credit_period: -12, // -12 days (healthy)
    items: [
      {
        sku: "15000068",
        name: "Bolivia Lait de terroir 45% Couverture 6kg",
        item_category: "Couverture & Chocolate",
        category_tag: "FG",
        item_packaging: "6kg Block",
        budget_qty_2026: 2200,
        actual_qty_2026: 2120,
        sales_2025_actual: 620000,
        sales_2026_budget: 704000,
        sales_2026_actual: 678400,
        margin_2026_budget: 231000,
        margin_2026_actual: 222600,
      },
      {
        sku: "FB-150-03",
        name: "Delipaste – Salted Butter Caramel 1.5kg",
        item_category: "Gourmet Sauces & Flavours",
        category_tag: "FG",
        item_packaging: "1.5kg Tin",
        budget_qty_2026: 1900,
        actual_qty_2026: 1810,
        sales_2025_actual: 285000,
        sales_2026_budget: 332500,
        sales_2026_actual: 316750,
        margin_2026_budget: 119700,
        margin_2026_actual: 114030,
      },
      {
        sku: "OV-100-03",
        name: "Pasteurized Liquid Egg Yolk 10kg",
        item_category: "Liquid & Powder Egg",
        category_tag: "Egg",
        item_packaging: "10kg Bag-in-Box",
        budget_qty_2026: 1600,
        actual_qty_2026: 1540,
        sales_2025_actual: 250000,
        sales_2026_budget: 296000,
        sales_2026_actual: 284900,
        margin_2026_budget: 84800,
        margin_2026_actual: 81620,
      },
    ],
  },
  {
    id: "cust-masterfood",
    customer_code: "E0000412",
    customer_name: "Master Foodservice Distributors",
    customer_country: "United Arab Emirates",
    customer_city: "Sharjah",
    customer_category: "Wholesale & Food Service",
    station: "Sharjah & Northern Emirates Hub (SHJ-02)",
    sales_exec_name: "Tariq Mahmoud",
    credit_period_days: 60,
    approved_credit_limit: 500000,
    net_receivables_ar: 425000,
    due_post_credit_period: 64000,
    due_exceeding_approved_limit: 0,
    days_post_credit_period: 18, // +18 days overdue
    items: [
      {
        sku: "OV-100-01",
        name: "Pasteurized Liquid Whole Egg 10kg",
        item_category: "Liquid & Powder Egg",
        category_tag: "Egg",
        item_packaging: "10kg Bag-in-Box",
        budget_qty_2026: 5200,
        actual_qty_2026: 4850,
        sales_2025_actual: 600000,
        sales_2026_budget: 702000,
        sales_2026_actual: 654750,
        margin_2026_budget: 192400,
        margin_2026_actual: 179450,
      },
      {
        sku: "SCH-405-02",
        name: "Wheat Flour – Type 405 25kg",
        item_category: "Specialty Flour & Grains",
        category_tag: "Ing",
        item_packaging: "25kg Paper Bag",
        budget_qty_2026: 6200,
        actual_qty_2026: 5800,
        sales_2025_actual: 625000,
        sales_2026_budget: 744000,
        sales_2026_actual: 696000,
        margin_2026_budget: 223200,
        margin_2026_actual: 208800,
      },
      {
        sku: "CSM-250-01",
        name: "BOS Special Bakery Mix 25kg",
        item_category: "Bakery Mixes",
        category_tag: "Ing",
        item_packaging: "25kg Sack",
        budget_qty_2026: 3400,
        actual_qty_2026: 3150,
        sales_2025_actual: 460000,
        sales_2026_budget: 561000,
        sales_2026_actual: 519750,
        margin_2026_budget: 170000,
        margin_2026_actual: 157500,
      },
    ],
  },
  {
    id: "cust-timhortons",
    customer_code: "E0000550",
    customer_name: "Tim Hortons UAE",
    customer_country: "United Arab Emirates",
    customer_city: "Dubai",
    customer_category: "Quick Service & Cafe Chains",
    station: "Jebel Ali Industrial Station (DXB-11)",
    sales_exec_name: "Rahul Agnihotri",
    credit_period_days: 30,
    approved_credit_limit: 120000,
    net_receivables_ar: 98000,
    due_post_credit_period: 0,
    due_exceeding_approved_limit: 0,
    days_post_credit_period: -3, // -3 days
    items: [
      {
        sku: "FB-150-03",
        name: "Delipaste – Salted Butter Caramel 1.5kg",
        item_category: "Gourmet Sauces & Flavours",
        category_tag: "FG",
        item_packaging: "1.5kg Tin",
        budget_qty_2026: 2100,
        actual_qty_2026: 1980,
        sales_2025_actual: 310000,
        sales_2026_budget: 367500,
        sales_2026_actual: 346500,
        margin_2026_budget: 132300,
        margin_2026_actual: 124740,
      },
      {
        sku: "DW-600-02",
        name: "Chocolate Frosting 6kg Pail",
        item_category: "Bakery Mixes & Frostings",
        category_tag: "FG",
        item_packaging: "6kg Plastic Tub",
        budget_qty_2026: 1800,
        actual_qty_2026: 1710,
        sales_2025_actual: 245000,
        sales_2026_budget: 279000,
        sales_2026_actual: 265050,
        margin_2026_budget: 102600,
        margin_2026_actual: 97470,
      },
      {
        sku: "OV-200-04",
        name: "High-Whip Dried Egg White Powder 20kg",
        item_category: "Liquid & Powder Egg",
        category_tag: "Egg",
        item_packaging: "20kg Multi-wall Bag",
        budget_qty_2026: 450,
        actual_qty_2026: 420,
        sales_2025_actual: 160000,
        sales_2026_budget: 189000,
        sales_2026_actual: 176400,
        margin_2026_budget: 56250,
        margin_2026_actual: 52500,
      },
    ],
  },
];

// 5. Monthly Trend Data (2025 Actual vs 2026 Budget vs 2026 Actual YTD)
export const MONTHLY_TREND_DATA: MonthlyTrendItem[] = [
  { month: "Jan", sales_2025: 720000, budget_2026: 840000, actual_2026: 815000 },
  { month: "Feb", sales_2025: 745000, budget_2026: 865000, actual_2026: 842000 },
  { month: "Mar", sales_2025: 810000, budget_2026: 940000, actual_2026: 918000 },
  { month: "Apr", sales_2025: 790000, budget_2026: 910000, actual_2026: 895000 },
  { month: "May", sales_2025: 830000, budget_2026: 960000, actual_2026: 940000 },
  { month: "Jun", sales_2025: 860000, budget_2026: 990000, actual_2026: 972000 },
  { month: "Jul", sales_2025: 890000, budget_2026: 1040000, actual_2026: 1015000 },
  { month: "Aug", sales_2025: 910000, budget_2026: 1060000, actual_2026: 1045000 },
  { month: "Sep", sales_2025: 880000, budget_2026: 1020000, actual_2026: 0 },
  { month: "Oct", sales_2025: 940000, budget_2026: 1090000, actual_2026: 0 },
  { month: "Nov", sales_2025: 980000, budget_2026: 1140000, actual_2026: 0 },
  { month: "Dec", sales_2025: 1065000, budget_2026: 1245000, actual_2026: 0 },
];

// 6. Sales Representative Budget vs Actual Dataset (Sales Rep Basis)
export interface SalesRepBudgetItem {
  id: string;
  rep_name: string;
  territory: string;
  account_count: number;
  sales_2025_actual: number;
  sales_2026_budget: number;
  sales_2026_actual: number;
  margin_2026_budget: number;
  margin_2026_actual: number;
  net_receivables_ar: number;
  achieved_pct: number;
  top_customer: string;
  top_category: string;
}

export const SALES_REP_BUDGET_DATA: SalesRepBudgetItem[] = [
  {
    id: "rep-rahul",
    rep_name: "Rahul Menon",
    territory: "Dubai South & Industrial",
    account_count: 14,
    sales_2025_actual: 3120000,
    sales_2026_budget: 3680000,
    sales_2026_actual: 3515000,
    margin_2026_budget: 1177600,
    margin_2026_actual: 1124800,
    net_receivables_ar: 282500,
    achieved_pct: 95.5,
    top_customer: "Spinneys Dubai LLC",
    top_category: "Liquid & Powder Egg",
  },
  {
    id: "rep-sarah",
    rep_name: "Sarah Jenkins",
    territory: "Abu Dhabi & Al Ain",
    account_count: 11,
    sales_2025_actual: 2850000,
    sales_2026_budget: 3350000,
    sales_2026_actual: 3210000,
    margin_2026_budget: 1139000,
    margin_2026_actual: 1091400,
    net_receivables_ar: 318000,
    achieved_pct: 95.8,
    top_customer: "Atlantis The Royal Palm",
    top_category: "Couverture & Chocolate",
  },
  {
    id: "rep-tariq",
    rep_name: "Tariq Mansoor",
    territory: "Sharjah & Northern Emirates",
    account_count: 15,
    sales_2025_actual: 3450000,
    sales_2026_budget: 3950000,
    sales_2026_actual: 3690000,
    margin_2026_budget: 1027000,
    margin_2026_actual: 959400,
    net_receivables_ar: 425000,
    achieved_pct: 93.4,
    top_customer: "Master Foodservice Distributors",
    top_category: "Specialty Flour & Grains",
  },
  {
    id: "rep-vikram",
    rep_name: "Vikram Patel",
    territory: "Deira & Wholesale Hub",
    account_count: 9,
    sales_2025_actual: 2100000,
    sales_2026_budget: 2500000,
    sales_2026_actual: 2390000,
    margin_2026_budget: 800000,
    margin_2026_actual: 764800,
    net_receivables_ar: 198000,
    achieved_pct: 95.6,
    top_customer: "Paul Bakery & Restaurant UAE",
    top_category: "Sourdough & Yeast",
  },
  {
    id: "rep-fatima",
    rep_name: "Fatima Al Mansoori",
    territory: "Ajman & Ras Al Khaimah",
    account_count: 8,
    sales_2025_actual: 1550000,
    sales_2026_budget: 1800000,
    sales_2026_actual: 1725000,
    margin_2026_budget: 612000,
    margin_2026_actual: 586500,
    net_receivables_ar: 145000,
    achieved_pct: 95.8,
    top_customer: "Northern Emirates Bakery Supplies",
    top_category: "Bakery Mixes & Frostings",
  },
];
