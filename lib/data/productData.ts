export interface ProductMaster {
  id: string;
  sku: string;
  name: string;
  title: string;
  brand: string;
  category: string;
  weight: string;
  uom: string;
  origin: string;
  image: string;
  url: string;
  item_code: string;
  base_price: number;
  currency: string;
  stock_status: "active" | "near_expiry" | "promo" | "out_of_stock" | "non_moving";
  stock_units: number;
  is_promotion: boolean;
  expiry_date?: string | null;
  substitute?: {
    id: string;
    sku: string;
    name: string;
    stock_status: string;
    stock_units: number;
    price: number;
  } | null;
  // Technical Knowledge Base for New Joiners
  bom_formulation?: {
    dosage: string;
    keyIngredients: string[];
    billOfMaterials: string;
    applicationRecipe: string;
    storageConditions: string;
    technicalNotes: string;
  };
  historical_6m_units: [number, number, number, number, number, number]; // M-6, M-5, M-4, M-3, M-2, M-1
  forecast_3m_units: [number, number, number];   // M+1, M+2, M+3
}

export interface FocSampleTrial {
  id: string;
  productName: string;
  givenDate: string;
  quantityGiven: string;
  status: "pending_feedback" | "trial_approved" | "reorder_placed" | "feedback_rejected";
  chefNotes?: string;
}

export interface CustomerForecast {
  customerId: string;
  customerName: string;
  territory: string;
  repId?: string;
  repName?: string;
  focSamples?: FocSampleTrial[];
  items: {
    productId: string;
    productName: string;
    brand: string;
    stockStatus: string;
    historical6mUnits: [number, number, number, number, number, number]; // M-6 to M-1
    historicalAvgUnits: number;
    m1ForecastUnits: number;
    m2ForecastUnits: number;
    m3ForecastUnits: number;
    unitPrice: number;
    trend: "up" | "stable" | "declining";
    riskFlag?: string;
    notes?: string;
  }[];
}

export interface SalesRepSummary {
  id: string;
  name: string;
  email: string;
  territory: string;
  role: string;
  avatarInitials: string;
  totalOrdersSoldAED: number;
  projected3MForecastAED: number;
  customerCount: number;
  quotaTargetAED: number;
  quotaCompletionPct: number;
  customers: CustomerForecast[];
}

export const MASTER_PRODUCTS: ProductMaster[] = [
  {
    id: "a0000001-0000-0000-0000-000000000001",
    sku: "FB-950-01",
    title: "Amarena Fabbri Gourmet Sauce",
    name: "Amarena Fabbri Gourmet Sauce 950g",
    brand: "Fabbri",
    category: "Gourmet Sauces & Flavours",
    weight: "950 gram",
    uom: "BOTTLE",
    origin: "Italy",
    image: "https://i0.wp.com/www.masterbakerme.com/wp-content/uploads/2025/03/Fabbri-Amarena-Fabbri-Gourmet-Sauce.jpg?fit=500%2C500&ssl=1",
    url: "https://www.masterbakerme.com/product/amarena-fabbri-gourmet-sauce/",
    item_code: "FB-950-01",
    base_price: 85,
    currency: "AED",
    stock_status: "near_expiry",
    stock_units: 145,
    is_promotion: false,
    expiry_date: "2026-08-18",
    substitute: null,
    bom_formulation: {
      dosage: "30g - 50g per 1kg finished gelato/pastry preparation",
      keyIngredients: ["Wild Amarena Cherry Pulp", "Sugar Syrup", "Natural Amarena Extract", "Citric Acid"],
      billOfMaterials: "BOM-FB-950: 65% Wild Cherries, 30% Invert Sugar, 5% Natural Gelling Agents",
      applicationRecipe: "Swirl directly into finished vanilla gelato, cheesecake topping, or pastry filling.",
      storageConditions: "Store between 15°C and 22°C in a cool, dry ambient room.",
      technicalNotes: "High thermo-stability; maintains gloss and texture after freezing and baking."
    },
    historical_6m_units: [210, 195, 180, 150, 110, 95],
    forecast_3m_units: [140, 130, 125]
  },
  {
    id: "a0000001-0000-0000-0000-000000000002",
    sku: "FB-420-02",
    title: "Amarena Fabbri Nut Brittle Snackolosi",
    name: "Amarena Fabbri Nut Brittle Snackolosi 4.2kg",
    brand: "Fabbri",
    category: "Gourmet Sauces & Flavours",
    weight: "4.2 KG",
    uom: "Pail",
    origin: "Italy",
    image: "https://i0.wp.com/www.masterbakerme.com/wp-content/uploads/2025/03/Fabbri-Amarena-Fabbri-Nut-Brittle-Snackolosi.jpg?fit=500%2C500&ssl=1",
    url: "https://www.masterbakerme.com/product/amarena-fabbri-nut-brittle-snackolosi/",
    item_code: "FB-420-02",
    base_price: 240,
    currency: "AED",
    stock_status: "active",
    stock_units: 320,
    is_promotion: false,
    expiry_date: null,
    bom_formulation: {
      dosage: "Direct inclusion / topping for specialty pralines and crunchy cake layers",
      keyIngredients: ["Caramelized Hazelnuts", "Amarena Pieces", "Cocoa Butter", "Crispy Wafer Bits"],
      billOfMaterials: "BOM-FB-420: 45% Nut Brittle, 35% Chocolate Paste, 20% Amarena Granules",
      applicationRecipe: "Layer between sponge cake sheets or use as gourmet gelato crunch inclusion.",
      storageConditions: "Keep sealed in original pail under 20°C.",
      technicalNotes: "Provides instant crunchy texture; resistant to moisture absorption."
    },
    historical_6m_units: [35, 40, 45, 52, 60, 68],
    forecast_3m_units: [65, 70, 75]
  },
  {
    id: "a0000001-0000-0000-0000-000000000003",
    sku: "DW-130-01",
    title: "Confibel Apricot Jam",
    name: "Confibel Apricot Jam 13kg Pail",
    brand: "Dawn",
    category: "Fruit Jams & Pastes",
    weight: "13 KG",
    uom: "PAL",
    origin: "Belgium",
    image: "https://i0.wp.com/www.masterbakerme.com/wp-content/uploads/2019/11/Confibel-Apricot-Jam-1.jpg?fit=500%2C500&ssl=1",
    url: "https://www.masterbakerme.com/product/confibel-apricot-jam/",
    item_code: "DW-130-01",
    base_price: 195,
    currency: "AED",
    stock_status: "near_expiry",
    stock_units: 80,
    is_promotion: false,
    expiry_date: "2026-08-25",
    bom_formulation: {
      dosage: "Baking glaze: dilutable up to 20% with warm water for tart glazing",
      keyIngredients: ["Apricot Concentrate", "Glucose Syrup", "Pectin", "Citric Acid"],
      billOfMaterials: "BOM-DW-130: 55% Apricot Fruit Solids, 40% Sugars, 5% Pectin & Acidifiers",
      applicationRecipe: "Apply warm (60°C) with brush on freshly baked Danish pastries & fruit tarts.",
      storageConditions: "Cool dry place; refrigerate after opening pail.",
      technicalNotes: "Bake-stable jam; excellent shine and set time upon cooling."
    },
    historical_6m_units: [110, 105, 95, 88, 70, 65],
    forecast_3m_units: [85, 90, 95]
  },
  {
    id: "a0000001-0000-0000-0000-000000000004",
    sku: "CSM-250-01",
    title: "BOS Special",
    name: "BOS Special Bakery Mix 25kg",
    brand: "CSM",
    category: "Bakery Mixes & Grains",
    weight: "25 kg",
    uom: "BAG",
    origin: "Germany",
    image: "https://i0.wp.com/www.masterbakerme.com/wp-content/uploads/2025/01/BOS-Special.jpg?fit=500%2C500&ssl=1",
    url: "https://www.masterbakerme.com/product/bos-special/",
    item_code: "CSM-250-01",
    base_price: 165,
    currency: "AED",
    stock_status: "out_of_stock",
    stock_units: 0,
    is_promotion: false,
    expiry_date: null,
    substitute: {
      id: "a0000001-0000-0000-0000-000000000012",
      sku: "SCH-405-02",
      name: "Wheat Flour – Type 405 25kg",
      stock_status: "active",
      stock_units: 450,
      price: 120
    },
    bom_formulation: {
      dosage: "100% premix basis: mix 10kg BOS Special + 6L Water + 200g Fresh Yeast",
      keyIngredients: ["Malted Rye Flour", "Sunflower Seeds", "Wheat Gluten", "Enzymes"],
      billOfMaterials: "BOM-CSM-250: 60% Specialty Malt Flour, 30% Whole Grains, 10% Dough Conditioners",
      applicationRecipe: "Knead 8 mins slow, 3 mins fast. Proof 45 mins at 35°C, bake at 220°C for 30 mins.",
      storageConditions: "Dry warehouse below 25°C and max 65% humidity.",
      technicalNotes: "High water absorption (62%); generates dark rustic crust and soft crumb."
    },
    historical_6m_units: [160, 155, 150, 140, 160, 150],
    forecast_3m_units: [165, 170, 180]
  },
  {
    id: "a0000001-0000-0000-0000-000000000005",
    sku: "FB-150-03",
    title: "Delipaste – Salted Butter Caramel",
    name: "Delipaste – Salted Butter Caramel 1.5kg",
    brand: "Fabbri",
    category: "Gourmet Sauces & Flavours",
    weight: "1.5 KG",
    uom: "TIN",
    origin: "Italy",
    image: "https://i0.wp.com/www.masterbakerme.com/wp-content/uploads/2025/03/Delipaste-Salted-Butter-Caramel.jpg?fit=500%2C500&ssl=1",
    url: "https://www.masterbakerme.com/product/delipaste-salted-butter-caramel/",
    item_code: "FB-150-03",
    base_price: 175,
    currency: "AED",
    stock_status: "promo",
    stock_units: 210,
    is_promotion: true,
    expiry_date: null,
    bom_formulation: {
      dosage: "70g - 100g per 1kg paste/cream base",
      keyIngredients: ["Brittany Salted Butter", "Caramelized Sugar", "Whole Milk Powder", "Fleur de Sel"],
      billOfMaterials: "BOM-FB-150: 40% Caramelized Sugar, 35% Salted Butter, 25% Cream Flavor Concentrates",
      applicationRecipe: "Fold directly into warm pastry cream, buttercream, or macaron filling.",
      storageConditions: "Ambient temperature under 22°C.",
      technicalNotes: "Authentic French Fleur de Sel flavor profile with smooth silk emulsion."
    },
    historical_6m_units: [50, 55, 60, 75, 95, 110],
    forecast_3m_units: [120, 140, 150]
  },
  {
    id: "a0000001-0000-0000-0000-000000000012",
    sku: "SCH-405-02",
    title: "Wheat Flour – Type 405",
    name: "Wheat Flour – Type 405 25kg",
    brand: "Schapfen Muhle",
    category: "Specialty Flour & Grains",
    weight: "25 kg",
    uom: "Bag",
    origin: "Germany",
    image: "https://i0.wp.com/www.masterbakerme.com/wp-content/uploads/2019/11/Wheat-Flour-T-450.jpg?fit=500%2C500&ssl=1",
    url: "https://www.masterbakerme.com/product/wheat-flour-type-405/",
    item_code: "SCH-405-02",
    base_price: 120,
    currency: "AED",
    stock_status: "active",
    stock_units: 450,
    is_promotion: false,
    expiry_date: null,
    bom_formulation: {
      dosage: "100% base flour for fine cakes, rolls, and puff pastries",
      keyIngredients: ["German Wheat Type 405 (Ash Content 0.45%)"],
      billOfMaterials: "BOM-SCH-405: 100% Pure Milled German Wheat Flour",
      applicationRecipe: "Ideal for delicate sponge cakes, croissants, and fine brioche doughs.",
      storageConditions: "Cool, dry, ventilated silo or bagged pallet room.",
      technicalNotes: "Low ash content ensures pure white color and soft gluten extensible structure."
    },
    historical_6m_units: [280, 290, 300, 320, 310, 325],
    forecast_3m_units: [330, 340, 350]
  }
];

export const CUSTOMER_FORECASTS: CustomerForecast[] = [
  {
    customerId: "c1111111-0000-0000-0000-000000000001",
    customerName: "Al Noor Trading LLC",
    territory: "Dubai",
    repId: "22222222-2222-2222-2222-222222222222",
    repName: "Rahul Menon",
    focSamples: [
      {
        id: "foc-01",
        productName: "Delipaste Salted Butter Caramel (1.5kg Trial Sample)",
        givenDate: "2026-07-15",
        quantityGiven: "1 Tin",
        status: "pending_feedback",
        chefNotes: "Chef Fatima testing in new summer macaron & tart filling line."
      },
      {
        id: "foc-02",
        productName: "Organic Spelt Sour Dough D740 (5kg Sample Bag)",
        givenDate: "2026-07-02",
        quantityGiven: "1 Bag",
        status: "trial_approved",
        chefNotes: "Pastry chef approved flavor profile. Ready for 25kg commercial order."
      }
    ],
    items: [
      {
        productId: "a0000001-0000-0000-0000-000000000001",
        productName: "Amarena Fabbri Gourmet Sauce 950g",
        brand: "Fabbri",
        stockStatus: "near_expiry",
        historical6mUnits: [55, 48, 42, 38, 32, 28],
        historicalAvgUnits: 40,
        m1ForecastUnits: 35,
        m2ForecastUnits: 30,
        m3ForecastUnits: 25,
        unitPrice: 85,
        trend: "declining",
        riskFlag: "Near Expiry (Batch Exp: 18 Aug) - Action: Clear stock",
        notes: "Client order dropped by 34% over last 6 months. Propose 10% volume discount."
      },
      {
        productId: "a0000001-0000-0000-0000-000000000004",
        productName: "BOS Special Bakery Mix 25kg",
        brand: "CSM",
        stockStatus: "out_of_stock",
        historical6mUnits: [48, 52, 50, 55, 50, 52],
        historicalAvgUnits: 51,
        m1ForecastUnits: 55,
        m2ForecastUnits: 55,
        m3ForecastUnits: 60,
        unitPrice: 165,
        trend: "up",
        riskFlag: "OUT OF STOCK - Substitution Available: Wheat Flour Type 405",
        notes: "Primary SKU out of stock. Trader recommendation: Switch 50% order to Wheat Flour 405."
      },
      {
        productId: "a0000001-0000-0000-0000-000000000005",
        productName: "Delipaste – Salted Butter Caramel 1.5kg",
        brand: "Fabbri",
        stockStatus: "promo",
        historical6mUnits: [15, 18, 20, 25, 35, 42],
        historicalAvgUnits: 26,
        m1ForecastUnits: 45,
        m2ForecastUnits: 50,
        m3ForecastUnits: 55,
        unitPrice: 175,
        trend: "up",
        riskFlag: "Head-Office Promo Push (15% Off 10+ Units)",
        notes: "Promotional campaign running for 30 days."
      },
      {
        productId: "a0000001-0000-0000-0000-000000000012",
        productName: "Wheat Flour – Type 405 25kg",
        brand: "Schapfen Muhle",
        stockStatus: "active",
        historical6mUnits: [75, 78, 80, 85, 92, 95],
        historicalAvgUnits: 84,
        m1ForecastUnits: 90,
        m2ForecastUnits: 95,
        m3ForecastUnits: 100,
        unitPrice: 120,
        trend: "up",
        notes: "High baseline demand for artisan baking line."
      }
    ]
  },
  {
    customerId: "c1111111-0000-0000-0000-000000000002",
    customerName: "Gulf Fresh Distributors",
    territory: "Dubai",
    repId: "22222222-2222-2222-2222-222222222222",
    repName: "Rahul Menon",
    focSamples: [
      {
        id: "foc-03",
        productName: "AROME LEVAIN Liquid Formula (2kg Sample)",
        givenDate: "2026-07-10",
        quantityGiven: "1 Bottle",
        status: "reorder_placed",
        chefNotes: "Sourdough hydration test successful. 10kg box added to monthly order."
      }
    ],
    items: [
      {
        productId: "a0000001-0000-0000-0000-000000000012",
        productName: "Wheat Flour – Type 405 25kg",
        brand: "Schapfen Muhle",
        stockStatus: "active",
        historical6mUnits: [115, 118, 120, 125, 130, 132],
        historicalAvgUnits: 123,
        m1ForecastUnits: 130,
        m2ForecastUnits: 135,
        m3ForecastUnits: 140,
        unitPrice: 120,
        trend: "stable",
        notes: "Consistent monthly contract reorder."
      }
    ]
  },
  {
    customerId: "c1111111-0000-0000-0000-000000000003",
    customerName: "Sharjah Ingredients Co.",
    territory: "Sharjah",
    repId: "22222222-2222-2222-2222-222222222222",
    repName: "Rahul Menon",
    focSamples: [],
    items: [
      {
        productId: "a0000001-0000-0000-0000-000000000003",
        productName: "Confibel Apricot Jam 13kg Pail",
        brand: "Dawn",
        stockStatus: "near_expiry",
        historical6mUnits: [30, 29, 28, 26, 25, 24],
        historicalAvgUnits: 27,
        m1ForecastUnits: 25,
        m2ForecastUnits: 30,
        m3ForecastUnits: 30,
        unitPrice: 195,
        trend: "stable",
        riskFlag: "Near Expiry Alert (Batch Exp: 25 Aug)",
        notes: "Expiring batch clearance deal requested."
      }
    ]
  }
];

export const SALES_REPS_DATA: SalesRepSummary[] = [
  {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Rahul Menon",
    email: "rahul.rep@demo.com",
    territory: "Dubai & Northern Emirates",
    role: "Senior Sales Representative",
    avatarInitials: "RM",
    totalOrdersSoldAED: 425800,
    projected3MForecastAED: 498500,
    customerCount: 3,
    quotaTargetAED: 450000,
    quotaCompletionPct: 110.7,
    customers: CUSTOMER_FORECASTS.filter((c) => c.repId === "22222222-2222-2222-2222-222222222222")
  }
];

export const VISIT_7_QUESTION_PROTOCOL = [
  {
    id: "q1",
    category: "FOC (Free of Charge) Sample Feedback",
    question: "Did the customer test provided free-of-charge (FOC) samples (e.g. Delipaste Salted Caramel / Sourdough)?",
    description: "Follow up before leaving visit to prevent missed sample commercial trial opportunities.",
    required: true,
    type: "boolean_with_notes"
  },
  {
    id: "q2",
    category: "Inventory & Expiry Audit",
    question: "Are any Master Baker products within 30 days of expiry or out of stock on shelves?",
    description: "Inspect backroom stock and retail shelf for batch dates (e.g. Amarena Fabbri, Apricot Jam).",
    required: true,
    type: "boolean_with_notes"
  },
  {
    id: "q3",
    category: "Pricing & Planogram Compliance",
    question: "Is shelf pricing aligned with contract terms and planogram display guidelines?",
    description: "Verify shelf tags and eye-level positioning for core bakery mixes and gourmet syrups.",
    required: true,
    type: "boolean_with_notes"
  },
  {
    id: "q4",
    category: "Competitor Intelligence",
    question: "Have you observed any competitor promotion, price reduction, or new product entry?",
    description: "Log competitor brands, substitute products, or aggressive discount campaigns.",
    required: true,
    type: "text"
  },
  {
    id: "q5",
    category: "Promotional & POP Display Audit",
    question: "Are active head-office promotions and POP display materials (banners, wobblers) installed?",
    description: "Audit summer push campaigns (e.g., Delipaste Salted Caramel / Brownie Mix).",
    required: true,
    type: "boolean_with_notes"
  },
  {
    id: "q6",
    category: "Payment & Invoice Reconciliation",
    question: "Has the customer committed to settling open balances / overdue invoices?",
    description: "Review outstanding open items (e.g. Al Noor open balance AED 12,500 open invoices).",
    required: true,
    type: "boolean_with_notes"
  },
  {
    id: "q7",
    category: "6M Buying History & 3M Trader Procurement Forecast",
    question: "Have you reviewed 6-month historical consumption and confirmed 3-month procurement forecast?",
    description: "Align internal trader purchasing requirement so inventory team knows what stock to buy.",
    required: true,
    type: "boolean_with_notes"
  }
];
