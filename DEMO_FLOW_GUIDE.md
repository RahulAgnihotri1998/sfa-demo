# Master Baker SFA Platform — Master Demo Presentation Script & Flow Guide

> **Live Production URL:** [https://sfa-demo.codeagni.com](https://sfa-demo.codeagni.com)  
> **Target Audience:** Client Executive Leadership, Sales Directors, IT Auditors & Commercial Managers  
> **Prepared by:** Solution Architecture & Engineering Team  
> **Document Version:** 3.0 (Comprehensive Flow)

---

## 📋 Executive Presentation Overview

| Demo Act | Platform Role | Key Capabilities Demonstrated | Target Screen URL |
|---|---|---|---|
| **Act 1: Sales Rep In-Field Journey** | Sales Representative (`rahul.rep@demo.com`) | Time scheduling, Interactive Store Map (HQ vs Branches), GPS Geofence Check-in, 7-Step Visit Protocol, AI Next Best Action, Competitor Intel, Customer 360, Order Builder & Market Basket Cross-Sell, Spec Sheet Sharing | `/rep/visit`<br>`/rep/customers`<br>`/rep/order/new`<br>`/rep/documents` |
| **Act 2: Executive Manager Oversight** | Regional Sales Manager (`ahmed.manager@demo.com`) | Geofence Exception Audit Matrix, Commercial Leads Pipeline, Field Shelf Audits & Competitor Feed, Real-time ERP Approvals, Salesperson Forecast Scorecards (MAPE) | `/manager/visit-matrix`<br>`/manager/leads`<br>`/manager/team`<br>`/manager/approvals`<br>`/manager/forecasting` |
| **Act 3: Strategic Analytics & Gamification** | Both Roles | Power BI Budget vs Actual matrices, Customer Drilldown, Sales Rep Leaderboard, Points & Achievement Badges | `/manager/dashboard`<br>`/rep/home` |

---

## 🎬 ACT 1: Sales Representative In-Field Journey

### 🔑 Login Step
1. Navigate to: `https://sfa-demo.codeagni.com/login`
2. Enter Sales Rep credentials:
   * **Email:** `rahul.rep@demo.com`
   * **Password:** `Demo@1234`
3. Click **Sign In**.

---

### Step 1.1: Visit Planning with Time Slots & Conflict Prevention (`/rep/visit`)
1. Navigate to **Visits** in the left sidebar (`/rep/visit`).
2. Click **`+ Schedule New Visit`**.
3. **What to highlight to the client:**
   * **Exact Time Slot & Duration:** Select a customer (e.g. *Al Noor Trading LLC*), pick today's date, choose **Time Slot: `10:00`**, and **Duration: `60 Minutes`**.
   * **Conflict-Check Engine:** Try scheduling an overlapping visit at the same date/time $\rightarrow$ point out the real-time **⚠️ Schedule Conflict Alert** preventing double-booking across client locations.
   * Click **Schedule** $\rightarrow$ show the green confirmation notification banner.

---

### Step 1.2: Interactive Territory & Store Map (`/rep/visit` ➔ `🗺️ Store Map` Tab)
1. On `/rep/visit`, click the **`🗺️ Store Map`** tab button.
2. **What to highlight to the client:**
   * **Live Rep GPS Beacon:** Point out the pulsing blue marker showing *"You Are Here"*.
   * **Main Corporate HQs vs Child Outlets:**
     * **⭐ Gold Star Pins:** Corporate Holding Group Headquarters (e.g. *Al Maya Group Holdings HQ*, *Spinneys Group HQ*, *Americana Hospitality HQ*).
     * **🏢 Indigo/Blue Pins:** Individual store branches and outlets (*Marina Walk Outlet*, *Deira City Centre*, *Mall of the Emirates*).
     * **⚠️ Red Alert Pins:** Branches flagged with at-risk credit limits or overdue invoices.
   * **Corporate Group Filter:** Open the dropdown, select **Al Maya Group Holdings (HQ)** $\rightarrow$ the map auto-zooms to that corporate cluster.
   * **Direct Store Selection:** Click on **Al Noor Trading LLC** pin on the map:
     * Right sidebar instantly displays the full **Store Dossier** (distance `8.3 km away`, Credit Limit `AED 120,000`, Open AR `AED 45,000`).
     * Show the one-click action buttons: **`🚀 Start Field Visit Check-In`**, **`📅 Schedule Visit`**, **`🛒 New Order`**, and **`🧭 Open in Google Maps`**.
   * Click **`🚀 Start Field Visit Check-In`** to transition directly into the store visit.

---

### Step 1.3: Active In-Store Visit Workflow (`/rep/visit/[customerId]`)
*(Direct URL: `https://sfa-demo.codeagni.com/rep/visit/c1111111-0000-0000-0000-000000000001`)*

1. **GPS Geofence Verification & Exception Logging:**
   * Point out the GPS Distance badge. If the rep is physically away from the store during a demo, show how the system detects the discrepancy (e.g. `2,513 km away`), flags an exception, and logs a manager override note to the permanent audit trail.
2. **Complete the 7-Question Visit Protocol Checklist:**
   * Step 1: *Inventory & Expiry Audit*
   * Step 2: *Pricing & Planogram Compliance*
   * Step 3: *Competitor Intelligence*
   * Step 4: *Promotional Displays*
   * Step 5: *Sample & FOC Trial Product Feedback*
   * Step 6: *Payment & Invoice Reconciliation (Open AR AED 12,500)*
   * Step 7: *3-Month Sales Forecast & Reorder Commit*
3. **Voice AI Mic Dictation:**
   * Click the **Microphone icon** (`Dictate report`) $\rightarrow$ speak a visit summary aloud. The browser Web Speech API transcribes your spoken voice into text in real-time.
4. **AI "Next Best Action" (🎯 NBA) Tab:**
   * Switch to the **`🎯 NBA`** tab.
   * **Explain the 4 AI Decision Rules:**
     * `⏰ Rule: Recency Gap` *(Customer hasn't ordered in 38 days $\rightarrow$ prompt re-order)*
     * `💰 Rule: High Margin` *(Delipaste sauces have 42% gross margin $\rightarrow$ push commercial pitch)*
     * `📉 Rule: Volume Decline` *(Volume dropped 24% $\rightarrow$ recover lost share)*
     * `⚠️ Rule: Expiry Push` *(Batch expiring in 22 days $\rightarrow$ pitch clearance price)*
   * Click **`+ Pitch & Add`** on a recommended product.
5. **Competitor Intelligence Capture Form:**
   * Open the Competitor Intel section.
   * Enter: Competitor (*Puratos / Masterline*), Product (*Baking Improver 10kg*), Observed Price (`AED 140`), Shelf Share (`25%`), and show the **Photo Upload** capability.
6. **In-Visit Order Cart Drawer & Market Basket Cross-Sell:**
   * Tap **`+ Add to Cart`** on *Wheat Flour Type 405*.
   * Click the bottom sticky bar **`View Cart`** to expand the drawer.
   * Point out the **`Frequently Paired Items (Basket Analysis)`** section:
     * Suggests *Confibel Apricot Jam* with 61% pair rate.
     * Click **`+ Add`** right inside the drawer to cross-sell.
   * Click **`Confirm & Book Order to ERP`** $\rightarrow$ generates Sage X3 Order ID (`SO-2026-XXXXX`).
7. **Close Visit:**
   * Select Outcome (*Order Taken & Merchandised*), set Follow-up Date, and click **`Complete & Save Visit`**.

---

### Step 1.4: Customer 360 Insights & Nearby Sorting (`/rep/customers`)
1. Navigate to **Customers** (`/rep/customers`).
2. **GPS Nearby Locator:** Click **`📍 Locate Nearby Accounts (GPS)`** $\rightarrow$ accounts dynamically re-order by proximity (`0.4 km away`, `1.2 km away`).
3. Click into **Al Noor Trading LLC** (`/rep/customers/c1111111-0000-0000-0000-000000000001`):
   * **Customer 360 Insights Panel:** Show Sage X3 credit aging buckets (Current, 30d, 60d, 90d+ overdue), payment terms, and monthly run-rate.
   * **Near-Expiry & Slow-Moving Stock Alerts:** Show warning flags for batches nearing expiration.

---

### Step 1.5: Order Builder & Market Basket Analysis (`/rep/order/new`)
1. Navigate to **New Order** (`/rep/order/new?customer=c1111111-0000-0000-0000-000000000001`).
2. **Frequently Purchased Section:** Point out the top 4 client favorites sorted strictly by historical purchase volume.
3. **Live Database Stock Depletion:** Point out `📦 Live Stock: 145 Units`. When an order is placed, PostgreSQL immediately decreases warehouse stock.
4. **Market Basket Analysis (Apriori Algorithm):**
   * Add **Wheat Flour Type 405** to cart.
   * Scroll down to the **`📦 Customers Also Bought (Basket Analysis)`** section.
   * Highlight **BOS Special Bakery Mix** (`Confidence: 78% · Lift: 2.3x`).
   * Explain: *"Our algorithm identified that 78% of bakers purchasing Type 405 flour also require specialty bakery mixes. Reps can add it in 1 click."*
5. **Special Price Request Workflow:**
   * Click **`Request Special Price`** on an item $\rightarrow$ Enter Target Price (`AED 75` vs `AED 85`) and Reason (*"Chef matching bulk competitor bid"*).
   * Submit approval request $\rightarrow$ status switches to `⏳ Pending Manager Approval`.

---

### Step 1.6: Document Knowledge Base & Client Sharing (`/rep/documents`)
1. Navigate to **Documents** (`/rep/documents`).
2. **Technical Knowledge Base for New Joiners:** Select a product SKU (e.g. *Cocoa Powder / Wheat Flour*) to inspect Bill of Materials (BOM), recommended dosage rates, application recipes, and storage conditions.
3. **1-Click Client Dispatch:** Click **`Send WhatsApp`** or **`Send Email`** to send the PDF specification sheet directly to the client's phone.
4. **Upload Document:** Show how reps can upload spec sheets, syncing to PostgreSQL and SharePoint.

---

## 👔 ACT 2: Executive Manager Oversight

### 🔑 Role Switch Step
1. Log out or open a private window.
2. Log in as Executive Manager:
   * **Email:** `ahmed.manager@demo.com`
   * **Password:** `Demo@1234`
3. Click **Sign In**.

---

### Step 2.1: Visit Matrix & Geolocation Exception Audit (`/manager/visit-matrix`)
1. Navigate to **Visit Matrix** (`/manager/visit-matrix`).
2. **Executive KPI Cards:**
   * Total Visits Completed
   * GPS Geofence Verified Rate %
   * 7-Question Protocol Compliance Rate (96.4%)
   * FOC Trial Sample Feedback Rate (100%)
3. **Geofence Telemetry & Override Audit:**
   * Click **`📍 Geo-Fence Telemetry`** on a visit flagged with `⚠️ Exception`.
   * Show the audit card: *"Check-in distance recorded at 2,513,775 meters from client site. Allowed: 150m. Override Status: Logged in Audit Trail."*
4. **Expandable 7-Question Protocol Log:**
   * Audit checklist answers, rep notes, voice dictation transcripts, and FOC trial feedback.
   * Click **`Export to Excel`** to download the compliance matrix.

---

### Step 2.2: Commercial Leads Pipeline (`/manager/leads`)
1. Navigate to **Leads Pipeline** (`/manager/leads`).
2. Show incoming commercial prospects (*Bake & Brew Artisanal Bakery*, *Golden Crust Pastry LLC*).
3. Demonstrate drag/select stage progression: `New` $\rightarrow$ `Qualified` $\rightarrow$ `Converted to Sage X3`.
4. Click **`Export to Excel`** to demonstrate executive pipeline reporting.

---

### Step 2.3: Team Management & In-Store Shelf Audits (`/manager/team`)
1. Navigate to **Team Ops** (`/manager/team`).
2. Select a sales rep (*Rahul Menon*).
3. **In-Store Shelf Audits Table:**
   * Review audited SKUs, On-Shelf vs Backstore units, Shelf Facings count, and Observed Shelf Prices.
4. **Competitor Intelligence Feed:**
   * Review competitor mentions, promotional activities, and photos captured by reps in the field.

---

### Step 2.4: Real-time Price Approvals & Sage ERP Simulator (`/manager/approvals`)
1. Navigate to **Approvals** (`/manager/approvals`).
2. Show the pending discount request submitted by Rahul Menon during Act 1 (`AED 75` requested vs `AED 85` list price).
3. Review margin impact $\rightarrow$ Click **`Approve Discount`**.
4. **Two-Way ERP Simulator:** Point out the **ERP Simulator Widget** demonstrating how approved quotes sync bidirectionally with Sage X3 Syracuse endpoints.

---

### Step 2.5: Salesperson Forecast Scorecards & Accuracy Tracking (`/manager/forecasting`)
1. Navigate to **Forecasting** (`/manager/forecasting`).
2. **6M Historical Run-Rate + 3M Procurement Matrix:** Show aggregated $M-6 \dots M-1$ sales history and $M+1, M+2, M+3$ supplier procurement quantities.
3. **Salesperson Forecast-Performance Scorecard (Bottom Table):**
   * Review multi-quarter accuracy trends (`2025-Q3`, `2025-Q4`, `2026-Q1`, `2026-Q2`).
   * Point out **MAPE (Mean Absolute Percentage Error)**, Variance %, and **Tier Grades (Tier A / Tier B / Tier C)**.
   * Click **`Export to Excel`** for the executive forecast accuracy report.

---

## 📊 ACT 3: Strategic Dashboards, Budget vs Actual & Gamification

### Step 3.1: Manager Power BI Sales Dashboard (`/manager/dashboard` & `/manager/budget-actual`)
1. Navigate to **Power BI Dashboard** (`/manager/dashboard`).
2. **Tab 1: Sales Reps Performance Matrix:** Budget Targets vs Actual YTD, Achievement %, Margins, Open AR, and assigned account counts.
3. **Tab 2: Master SKU Portfolio Matrix:** SKU-level Budget vs Actual units and AED sales.
4. **Tab 3: Customer Account SKU Drilldown:** Drill down into specific corporate accounts (*Spinneys, Carrefour, Al Maya*) to audit SKU-level purchasing performance.
5. Demonstrate **Export to Excel (`.xlsx`)** on every analytics table.

---

### Step 3.2: Sales Rep Home Dashboard & Gamification (`/rep/home`)
1. Switch back to Sales Rep view (`/rep/home`).
2. **Gamification & Daily Streaks Banner:**
   * Show rep points, current daily visit streak (e.g. *🔥 5-Day Streak*), monthly leaderboard rank (*#1 in Dubai Territory*), and unlocked achievement badges (*Speed Demonstrator, Top Cross-Seller*).
3. **Recent Orders & Sync Status:**
   * Review recent orders booked into Sage X3 with live ERP status badges.

---

## 🎯 5 Golden Talking Points for the Closing

1. **Eliminates Middle-Man Trader Guesswork:** 6-Month historical velocity + 3-Month supplier forecast matrices allow Master Baker to order exact container volumes from European suppliers with 30–90 day lead times.
2. **AI with Full Transparency:** Every recommendation (Next Best Action & Market Basket cross-sell) explains *why* it was suggested with transparent provenance tags.
3. **Field Rep Accountability:** 7-question visit protocols, mandatory FOC trial feedback guards, and GPS geofence exception tracking ensure store visits actually happen.
4. **Integrated Enterprise ERP:** Real-time stock depletion in PostgreSQL, two-way discount approval workflows, and Sage X3 Syracuse REST/OData mapping.
5. **Instant Board-Ready Reporting:** One-click **Export to Excel (`.xlsx`)** enabled across every table, matrix, and scorecard on the platform.

---

*© 2026 Master Baker ME · SFA Platform Master Demonstration Script*
