# Master Baker SFA Platform — Theoretical Flow & Presentation Guide

> **Target Platform:** Master Baker Enterprise Sales Force Automation (SFA) & Manager Portal  
> **Target Audience:** Executive Leadership, Commercial Directors, Sales Managers & IT Stakeholders  
> **Document Purpose:** Complete Conceptual Workflow, Feature Explanations, Business Rationale & Presentation Script

---

## 📑 Presentation Table of Contents
1. [Executive Summary & Core Business Challenges](#1-executive-summary--core-business-challenges)
2. [Act 1: Sales Representative Field Experience (Automation & AI Co-Pilot)](#2-act-1-sales-representative-field-experience)
   * 2.1 [Intelligent Visit Scheduling & Conflict Prevention](#21-intelligent-visit-scheduling--conflict-prevention)
   * 2.2 [Spatial Territory Map & Corporate Account Hierarchy](#22-spatial-territory-map--corporate-account-hierarchy)
   * 2.3 [Active Store Visit Protocol, GPS Telemetry & Voice AI Dictation](#23-active-store-visit-protocol-gps-telemetry--voice-ai-dictation)
   * 2.4 [AI Next Best Action (NBA) Recommendation Engine](#24-ai-next-best-action-nba-recommendation-engine)
   * 2.5 [Competitor Intelligence & Shelf Share Audit](#25-competitor-intelligence--shelf-share-audit)
   * 2.6 [Customer 360 Insights, AR Aging & Expiry Warnings](#26-customer-360-insights-ar-aging--expiry-warnings)
   * 2.7 [Sales Order Builder & Market Basket Analysis (Cross-Selling)](#27-sales-order-builder--market-basket-analysis-cross-selling)
   * 2.8 [Technical Spec Sheets & Client Knowledge Base](#28-technical-spec-sheets--client-knowledge-base)
3. [Act 3: Executive Manager Portal (Governance, Compliance & Procurement)](#3-act-2-executive-manager-portal)
   * 3.1 [Visit Matrix & Geolocation Exception Auditing](#31-visit-matrix--geolocation-exception-auditing)
   * 3.2 [Commercial Leads Pipeline & Account Conversion](#32-commercial-leads-pipeline--account-conversion)
   * 3.3 [Field Team Operations, Shelf Facings & Competitor Feed](#33-field-team-operations-shelf-facings--competitor-feed)
   * 3.4 [Two-Way Sage X3 ERP Pricing Approvals](#34-two-way-sage-x3-erp-pricing-approvals)
   * 3.5 [3-Month Procurement Forecasting & Supplier Alignment](#35-3-month-procurement-forecasting--supplier-alignment)
   * 3.6 [Salesperson Forecast Accuracy Scorecards (MAPE Engine)](#36-salesperson-forecast-accuracy-scorecards-mape-engine)
4. [Act 3: Strategic Dashboards & Gamification](#4-act-3-strategic-dashboards--gamification)
   * 4.1 [Power BI Budget vs Actual Multi-Dimensional Analytics](#41-power-bi-budget-vs-actual-multi-dimensional-analytics)
   * 4.2 [Sales Rep Gamification, Daily Streaks & Recognition](#42-sales-rep-gamification-daily-streaks--recognition)
5. [Key Strategic Takeaways for Executive Decision Makers](#5-key-strategic-takeaways-for-executive-decision-makers)

---

## 1. Executive Summary & Core Business Challenges

Food service distribution in the bakery and confectionery sector involves unique operational complexities that standard off-the-shelf CRM tools fail to address:

```
┌──────────────────────────────────────┬─────────────────────────────────────────────────────────────┐
│ Industry Operational Challenge       │ SFA Platform Solution Architecture                         │
├──────────────────────────────────────┼─────────────────────────────────────────────────────────────┤
│ 🚢 Long Import Lead Times (30–90 Days)│ 6M Historical Velocity + 3M Rolling Procurement Forecasts    │
│ 🏬 Multi-Branch Corporate Accounts   │ Parent Holding Group vs Child Outlet Hierarchy Modeling     │
│ 👁️ Field Rep Blindspots on Rep Visit  │ AI "Next Best Action" (NBA) Real-Time Pitch Co-Pilot        │
│ 📍 Unverified Store Check-Ins        │ Haversine GPS Geofencing with Exception Audit Logs          │
│ ⏳ Expiring Warehouse Inventory      │ Dynamic Expiry Countdown & Push Recommendation Triggers     │
│ 📝 Slow Quotation & Approval Cycles  │ Two-Way Sage X3 ERP Integration with Real-Time WebSockets   │
└──────────────────────────────────────┴─────────────────────────────────────────────────────────────┘
```

---

## 2. Act 1: Sales Representative Field Experience

### 2.1 Intelligent Visit Scheduling & Conflict Prevention
* **The Business Problem:** Sales representatives often plan visits as broad dates without time commitments, leading to inconsistent customer coverage, overlapping visits, and wasted drive time.
* **How the Platform Solves It:**
  * Every visit captures both a **planned date** and an **exact time slot** with estimated meeting duration (30, 45, 60, or 90 minutes).
  * **Real-time Conflict Checking:** When a rep attempts to book a visit overlapping with an existing appointment, the platform flags a conflict alert to prevent double-booking.
  * **What to Explain:** *"This structure transforms field scheduling from vague daily check-ins into structured, time-managed client itineraries."*

---

### 2.2 Spatial Territory Map & Corporate Account Hierarchy
* **The Business Problem:** Sales reps struggle to visualize account clusters and distinguish between corporate parent decision-makers and individual branch kitchens.
* **How the Platform Solves It:**
  * **Visual Map Hierarchy:**
    * **⭐ Gold Star Pins:** Corporate Holding Group Headquarters (e.g. *Al Maya Group Holdings HQ*, *Spinneys Group HQ*, *Americana Hospitality HQ*).
    * **🏢 Indigo Pins:** Individual store branches and retail bakeries (*Marina Walk Outlet*, *Deira City Centre*, *Al Quoz Central Hub*).
    * **⚠️ Red Pins:** Outlets flagged with at-risk credit limits or overdue invoices.
    * **📍 Live GPS Beacon:** Real-time device location showing where the rep is standing.
  * **Interactive Store Dossier:** Clicking any pin opens a full briefing card (distance in kilometers, credit limit, open AR balance, store manager contact) and provides one-click action buttons to start a visit, schedule an appointment, or place an order.
  * **What to Explain:** *"Reps can see their entire territory visually, identify nearby stores between appointments, and navigate directly using turn-by-turn Google Maps."*

---

### 2.3 Active Store Visit Protocol, GPS Telemetry & Voice AI Dictation
* **The Business Problem:** Store visits often lack standardization; reps forget to check expired stock or audit competitor pricing, and typing notes on a phone keyboard is slow.
* **How the Platform Solves It:**
  * **GPS Geofence Verification:** Automatically compares device coordinates against the customer's registered store coordinates. If the rep is outside the allowed radius (e.g. 150m), the platform flags a location exception and logs a manager override note to ensure field accountability.
  * **7-Step Standardized Protocol Checklist:**
    1. *Inventory & Expiry Audit* (Check shelves for near-expiry batches).
    2. *Pricing & Planogram Compliance* (Verify contracted shelf tags).
    3. *Competitor Intelligence* (Capture competitor price cuts).
    4. *Promotional & POP Display Audit* (Confirm marketing assets are installed).
    5. *Sample & FOC Trial Product Feedback* (Mandatory pre-exit check on trial ingredients).
    6. *Payment & Invoice Reconciliation* (Review open balances).
    7. *3-Month Sales Forecast & Reorder Commit* (Align on future production demand).
  * **Voice AI Dictation:** Reps click the microphone icon and speak naturally. Spoken audio is transcribed directly into the visit report in real time using browser Web Speech AI.
  * **What to Explain:** *"Standardizing every store visit to 7 mandatory audit questions ensures thorough field execution and gives management complete visibility across the entire territory."*

---

### 2.4 AI Next Best Action (NBA) Recommendation Engine
* **The Business Problem:** With over 500 SKUs in the catalog, sales reps default to only pitching the few items they personally remember, missing high-margin opportunities and customer re-order signals.
* **How the Platform Solves It:**
  * Uses a multi-factor composite scoring engine (0–100) combining 4 transparent business rules:
    * `⏰ Recency Gap (35% Weight)`: Identifies customers whose normal replenishment cadence has elapsed (e.g. no order in > 30 days) $\rightarrow$ triggers a re-order reminder.
    * `💰 High Margin Push (25% Weight)`: Prioritizes highly profitable items (e.g. Delipaste sauces with > 30% gross margin) to increase sales profitability.
    * `📉 Volume Decline (20% Weight)`: Detects when a customer's purchasing drops by > 20% compared to previous quarters $\rightarrow$ prompts the rep to investigate and recover lost share.
    * `⚠️ Near Expiry Clearance (20% Weight)`: Identifies warehouse batches expiring within 45 days $\rightarrow$ prompts promotional clearance pricing to eliminate write-offs.
  * **Transparent Provenance Badges:** Every recommendation explains *why* it was suggested, building trust with the sales team.
  * **What to Explain:** *"The AI acts as an intelligent co-pilot in the rep's pocket, telling them exactly what to pitch, why to pitch it, and how it benefits both the customer and company profitability."*

---

### 2.5 Competitor Intelligence & Shelf Share Audit
* **The Business Problem:** Competitive price cuts, new rival brands, and shifting shelf spaces go unnoticed by headquarters until sales drop weeks later.
* **How the Platform Solves It:**
  * Embedded directly into the visit closure workflow.
  * Captures competitor name (e.g. *Puratos, Masterline*), product category, observed retail price (AED), estimated shelf share percentage, promotional details, and photo upload.
  * Synchronizes instantly to the executive manager's competitor intelligence feed.
  * **What to Explain:** *"Every field visit doubles as a live market research touchpoint, giving commercial directors early warning of competitor price movements."*

---

### 2.6 Customer 360 Insights, AR Aging & Expiry Warnings
* **The Business Problem:** Reps walk into meetings blind to accounting disputes, unpaid invoices, or credit holds, risking uncollectible orders.
* **How the Platform Solves It:**
  * **Customer 360 Panel:** Aggregates live Sage X3 financial data, including credit limits, net receivables, credit utilization %, and aging buckets (Current, 30 days, 60 days, 90+ days overdue).
  * **Batch Expiry & Slow-Moving Stock Indicators:** Displays countdown badges on products with near-expiry inventory (e.g. *Expires in 22 days*), allowing reps to negotiate bulk clearance discounts before goods spoil.
  * **What to Explain:** *"Reps have complete commercial transparency before discussing new orders, protecting cash flow and resolving invoice discrepancies on the spot."*

---

### 2.7 Sales Order Builder & Market Basket Analysis (Cross-Selling)
* **The Business Problem:** Sales order entry is often slow and manual, failing to capitalize on natural product pairings that increase average order value.
* **How the Platform Solves It:**
  * **Frequently Purchased Section:** Highlights the customer's top 4 historical favorites sorted by volume for rapid 1-click re-ordering.
  * **Live PostgreSQL Database Depletion:** Immediately decrements available warehouse units upon order submission, auto-switching items to *Out of Stock* if inventory reaches zero and suggesting pre-configured substitutes.
  * **Market Basket Analysis (Apriori Association Engine):**
    * When an item is added to the cart (e.g. *Wheat Flour Type 405*), the platform scans thousands of past transaction patterns and suggests proven companion products (e.g. *BOS Special Bakery Mix* at 78% confidence and 2.3x lift).
    * Available in both the main Order Builder and the In-Visit Cart Drawer.
  * **Special Price Discount Approval Workflow:** Allows reps to request custom contract pricing with a commercial justification, sending real-time approval requests to the manager portal.
  * **What to Explain:** *"Market basket analysis automatically upsells complementary ingredients, raising order values while preventing inventory stockouts."*

---

### 2.8 Technical Spec Sheets & Client Knowledge Base
* **The Business Problem:** Junior sales reps frequently call technical bakery experts to answer basic customer questions about dosage rates, recipes, or storage conditions.
* **How the Platform Solves It:**
  * Provides a self-service Bill of Materials (BOM) knowledge base for every SKU, containing dosage guidelines, formulation recipes, allergen data, and storage temperatures.
  * **1-Click Client Dispatch:** Reps can send official PDF specification sheets directly to the client's phone via WhatsApp or email with one click.
  * **What to Explain:** *"New joiners can answer technical chef questions independently on day one, accelerating the sales cycle."*

---

## 3. Act 2: Executive Manager Portal

### 3.1 Visit Matrix & Geolocation Exception Auditing
* **The Business Problem:** Sales managers lack verifiable proof of field activity and cannot audit whether reps adhered to quality standards during client walkthroughs.
* **How the Platform Solves It:**
  * **Executive Compliance KPIs:** Tracks overall visit completion rates, GPS geofence verification percentage, 7-question protocol compliance, and sample feedback capture rates.
  * **Geofence Telemetry Audit Trail:** Details check-in distances, perimeter violation deltas (e.g. rep located 2,513 km away), and recorded manager override justifications.
  * **Protocol Inspection:** Managers can expand any visit to audit every checklist answer, rep field notes, voice transcripts, and trial sample outcomes.
  * **What to Explain:** *"Managers have complete operational control to distinguish between verified store visits and remote exceptions."*

---

### 3.2 Commercial Leads Pipeline & Account Conversion
* **The Business Problem:** New customer prospects captured in the field often get lost in personal notebooks without formal qualification or territory tracking.
* **How the Platform Solves It:**
  * Centralizes all field-captured commercial leads with chef contact information, meeting notes, and assigned sales representatives.
  * Visualizes the prospect lifecycle across 4 distinct stages: `New` $\rightarrow$ `Qualified` $\rightarrow$ `Converted to Sage X3` $\rightarrow$ `Lost`.
  * **What to Explain:** *"Ensures every prospective bakery or hotel kitchen is methodically tracked and converted into an active trading account."*

---

### 3.3 Field Team Operations, Shelf Facings & Competitor Feed
* **The Business Problem:** Headquarters has limited visibility into how products are actually merchandised on client shelves and what competitors are doing in each territory.
* **How the Platform Solves It:**
  * **In-Store Shelf Audits Table:** Audits on-shelf quantity, backstore reserve units, shelf facing counts, and observed shelf retail prices per SKU.
  * **Territory Competitor Feed:** Aggregates competitor price promotions and shelf photos across all sales representatives in one feed.
  * **What to Explain:** *"Gives sales leadership real-time merchandising intelligence without having to conduct physical store audits themselves."*

---

### 3.4 Two-Way Sage X3 ERP Pricing Approvals
* **The Business Problem:** Discount approvals typically involve back-and-forth phone calls and delayed emails, slowing down deal closing.
* **How the Platform Solves It:**
  * Rep discount requests appear instantly on the manager portal with full gross margin impact analysis.
  * Managers click **Approve** or **Reject**, pushing updates in real time to the rep's screen via WebSockets and syncing bidirectionally with Sage X3 Syracuse REST endpoints.
  * **What to Explain:** *"Reduces discount approval turnaround time from hours to seconds while maintaining strict margin governance."*

---

### 3.5 3-Month Procurement Forecasting & Supplier Alignment
* **The Business Problem:** As a middle-man trader importing specialty goods from European suppliers (Germany, Italy, Belgium), Master Baker faces 30 to 90 days of maritime shipping lead time. Ordering inaccuracies lead to either costly stockouts or expiring inventory.
* **How the Platform Solves It:**
  * Displays 6 months of historical customer purchase velocity ($M-6 \dots M-1$) alongside 3 rolling months of forward demand projections ($M+1, M+2, M+3$).
  * Aggregates territory demand across all customer accounts to generate accurate supplier Purchase Orders for European manufacturers.
  * **What to Explain:** *"Bridges field sales demand with supply chain procurement, ensuring European containers arrive exactly when customer production schedules require."*

---

### 3.6 Salesperson Forecast Accuracy Scorecards (MAPE Engine)
* **The Business Problem:** Sales reps often submit inflated forecasts to look ambitious or artificially low forecasts to easily beat targets, distorting procurement planning.
* **How the Platform Solves It:**
  * Audits historical quarterly forecast accuracy across multiple consecutive quarters (`2025-Q3`, `2025-Q4`, `2026-Q1`, `2026-Q2`).
  * Uses **Mean Absolute Percentage Error (MAPE)** and Variance % to evaluate committed forecasts against actual sales volume.
  * Automatically ranks sales reps into performance tiers:
    * **Tier A (Excellence):** Mean accuracy $\ge 93\%$, MAPE $\le 7\%$.
    * **Tier B (Reliable):** Mean accuracy $88\% - 92\%$, MAPE $8\% - 12\%$.
    * **Tier C (Needs Review):** Mean accuracy $< 88\%$, MAPE $> 12\%$.
  * **What to Explain:** *"Holding sales reps accountable for forecast accuracy ensures supply chain teams can trust the procurement numbers they receive."*

---

## 4. Act 3: Strategic Dashboards & Gamification

### 4.1 Power BI Budget vs Actual Multi-Dimensional Analytics
* **The Business Problem:** Executive board members and commercial directors need multi-dimensional reporting across sales reps, product SKUs, and customer categories.
* **How the Platform Solves It:**
  * **Sales Rep Matrix:** Compares 2026 budget targets against YTD actuals, gross margin %, open AR exposure, and assigned account counts.
  * **Master Portfolio SKU Matrix:** Tracks SKU-level sales volumes, category tags (Egg, Ingredients, Finished Goods), and unit margins.
  * **Customer Category & Account Drilldown:** Allows leadership to drill down into specific corporate accounts (*Spinneys, Carrefour, Al Maya*) to audit SKU-level purchasing health.
  * **One-Click Excel Export:** Every matrix includes a green `.xlsx` export button for instant board presentation preparation.
  * **What to Explain:** *"Provides executive leadership with granular, real-time commercial analytics across territories, products, and customer categories."*

---

### 4.2 Sales Rep Gamification, Daily Streaks & Recognition
* **The Business Problem:** Field sales can be repetitive, leading to rep burnout and inconsistent daily visit activity.
* **How the Platform Solves It:**
  * **Gamification Banner:** Rewards reps with points for completing visit checklists, recording competitor intelligence, and booking cross-sell orders.
  * **Daily Visit Streaks:** Tracks consecutive days of completed visit itineraries (e.g. *🔥 5-Day Streak*).
  * **Territory Leaderboards & Badges:** Displays monthly territory ranking and unlocks achievement badges (*Speed Demonstrator, Top Cross-Seller, Quality Auditor*).
  * **What to Explain:** *"Gamification turns daily field compliance into a motivating, rewarding experience for the sales team."*

---

## 5. Key Strategic Takeaways for Executive Decision Makers

1. **Eliminates Import Guesswork:** 6-Month historical velocity + 3-Month supplier forecast matrices allow Master Baker to order exact container volumes from European suppliers with 30–90 day lead times.
2. **Transparent, Explainable AI:** Recommendations (Next Best Action & Market Basket cross-sell) explain *why* they were suggested using transparent provenance rules, avoiding opaque "black box" algorithms.
3. **Guaranteed Field Accountability:** 7-question visit protocols, mandatory FOC sample feedback guards, and GPS geofence exception tracking ensure store walkthroughs actually happen.
4. **Seamless Enterprise ERP Integration:** Real-time PostgreSQL stock depletion, two-way pricing approvals, and Syracuse REST/OData mapping keep field sales synchronized with core back-office accounting.
5. **Instant Board-Ready Governance:** One-click **Export to Excel (`.xlsx`)** enabled across every data table, matrix, and scorecard on the platform.

---

*© 2026 Master Baker ME · SFA Platform Master Conceptual Presentation Guide*
