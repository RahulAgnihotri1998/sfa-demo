SFA Demo — What We Built, and Why

This document explains the decisions behind the demo app built for the Sales Force
Automation (SFA) RFP response — useful as a reference for yourself, and as backup
material if the client asks "why did you build it this way?" during the demo.

The original RFP — quick summary




What's being procured: A Sales Force Automation mobile/web app for field sales
reps, integrated with Sage X3 (ERP), covering the full field-sales cycle — visit
planning, order capture, pricing, approvals, reporting, and document sharing.
Evaluation format: Vendors get a final live demo round (3–7 Aug) covering
8 mandatory scenarios (Table 6 of the RFP), alongside a written compliance
matrix against every functional requirement (Section 7), which is scored ~30% of
total evaluation weight (Table 4).
Key functional requirements referenced by this build:

FR-01: role-based access (rep/manager), territory and reporting hierarchy
FR-02: 360° customer view — contacts, address, account owner, buying history, pricing, open items
FR-04–FR-08: visit planning, geo-fenced check-in, mandatory visit closure fields, voice notes, auto follow-ups
FR-09: purchase decline detection and alerting
FR-10: cross-sell/upsell recommendations
FR-11–FR-12: stock status and alternative-product suggestions
FR-13–FR-14: order capture with customer-and-product-specific pricing, synced to Sage X3
FR-15: special pricing request → manager approval workflow
FR-16: head-office promotions pushed to reps
FR-17–FR-19: product knowledge base, document sharing (email/WhatsApp), contract tracking
Non-functional: auditability of pricing, approvals, orders, visits, and contracts



Open questions the RFP itself leaves unresolved (worth clarifying with the
client before the demo): whether WhatsApp sharing uses a corporate or individual
business-number model, and whether Sage X3 sandbox/API access will be provided
before the demo date.


The situation

The RFP asks for a live demo of 8 mandatory scenarios (Table 6) during the final
evaluation round (3–7 Aug), alongside a written compliance matrix (Section 7). The
proposal deadline (15 Jul) doesn't leave time to wait for ERP sandbox access, real
WhatsApp Business API approval, etc. — so the goal was: build something that proves
real technical capability, without depending on things outside our control.

Why this tech stack

ChoiceReasonNext.js 15 (App Router)Single codebase for both UI and API routes — no separate backend server needed, which matters for a tight build timeline. Also what Code Agni already builds on, so no ramp-up time.SupabasePostgres + Auth + Realtime + Storage in one — covers login, role-based data, live approval updates, and PDF hosting for document sharing, without standing up separate services.Resend (email)Simplest API for actually sending real email in a demo — no SMTP config headaches.PWA, not native appClient asked for a "mobile app"; a real native app needs app-store review cycles we don't have time for. A PWA installs to the home screen and feels native, without that overhead — and it's what most enterprise SFA tools (even paid ones) actually ship as.Tailwind + component-level stylingFast to build consistent, professional-looking screens under time pressure — no separate design system to build first.

Why one app with two roles, not two apps

The RFP's own scenarios span both a field rep's daily work (visits, orders, documents)
and a manager's oversight (approvals, dashboards). Building this as one app with
role-based routing (/rep/* vs /manager/*, enforced in middleware.ts) mirrors
how the real product would work, and lets us demo the approval workflow live — a rep
submits a discount request on their phone, a manager approves it on their screen, and
it updates in real time. That live cross-role interaction is a stronger demo moment
than two disconnected apps would be.

Scenario-by-scenario: what's real vs simulated, and why

#ScenarioStatusWhy1Customer visitRealUses the device's actual GPS via the browser's Geolocation API, checked against a stored geo-fence radius. No reason to fake this — it's just browser + math.2Purchase decline alertReal (rule-based)A simple, explainable rule (latest month vs. prior average, flag if drop ≥40%) computed from seeded purchase history. Deliberately not "AI/ML" — a transparent rule is more defensible in a live Q&A than a black-box model we can't explain.3Cross-sell/upsellReal (seeded pairings)Product recommendation pairings are stored data, not a trained model. Same logic as #2 — controllable and explainable beats impressive-but-fragile for a demo.4Stock/alternativesRealStraightforward stock-status flags and a stored alternative-product mapping.5Special pricing approvalReal, liveFull request → notify → approve/reject flow, with Supabase Realtime pushing the decision back to the rep's screen instantly.6Order flow → Sage X3SimulatedNo Sage X3 sandbox access yet. The order genuinely gets captured and stored; only the ERP round-trip is simulated with a staged status pipeline (Captured → Validated → Sent to Sage X3 → Confirmed) and a generated order number. The API route (/api/orders/[id]/advance) is written so swapping in a real Sage X3 Web Services/OData call later is a contained change, not a rewrite.7DashboardRealCharts and KPIs computed from actual data in the database (orders, visits, follow-ups).8Document sharingRealGenuinely sends email via Resend with a real inbox delivery — deliberately not faked, since it's simple to make real and "watch the email arrive live" is a strong demo moment.

Not built, mentioned in the proposal only: WhatsApp document sharing (would need
Meta Cloud API or a BSP like Twilio/Gupshup, plus the client's own decision on
corporate vs. individual business numbers — which the RFP itself leaves open) and
voice-to-text notes (stubbed as a button, not wired to the Web Speech API, since it
doesn't materially change what evaluators are scoring).

Why customer-specific pricing was added

Raised in a client meeting after the initial two scenarios were scoped: prices vary
customer to customer, not just by product. This maps to FR-14 in the RFP. Implemented
as a customer_pricing table (customer + product → price) rather than a formula, so
it demos clearly: select a different customer, watch the price change on the same
product, with no manual re-entry.

Data model philosophy

One shared schema (schema.sql) underlies all 8 scenarios rather than separate
tables per feature — e.g., purchase_history feeds both the decline alerts and the
dashboard; orders/order_items feed both the order flow and the manager's team
view. This keeps the demo internally consistent: an order placed in scenario 6 shows
up in the scenario 7 dashboard immediately, which is the kind of coherence evaluators
notice.

seed.sql deliberately plants one believable story (Al Noor Trading's cocoa powder
purchases dropping 3 months running) rather than random data, so the decline-alert
demo has something real to point at instead of an empty state.

Demo walkthrough script

Suggested click-path for the live demo, covering all 8 scenarios in one continuous
story rather than 8 disconnected clicks — this reads better to evaluators than jumping
around.


Log in as rep → Home screen shows pending follow-ups and an at-risk customer alert.
Customers → Al Noor Trading → 360° view: contacts, open items, negotiated pricing, purchase history.
Visit → Check In (device GPS verifies against the customer's geo-fence) → fill in outcome, next action, follow-up date (mandatory) → Close Visit → a follow-up is auto-created.
New Order → Al Noor Trading:

Point out the price shown is specific to this customer (switch to another customer to show it change)
Try adding the out-of-stock item → alternative product suggested → add it instead
Add cocoa powder → a cross-sell suggestion appears (e.g. vanilla extract) → add it
Click "Request special price" on a line → submit for approval
Submit the order → watch the status pipeline animate: Captured → Validated → Sent to Sage X3 → Confirmed, ending with a generated Sage order number



Documents → send the cocoa spec sheet to the customer by email → open your inbox live to show delivery
Alerts → show the purchase-decline flag on Al Noor Trading (3-month downward trend)
Log out, log in as manager:

Dashboard → order value, visits closed, overdue follow-ups, territory chart
Approvals → approve the discount request from step 4 → switch back to the rep's session to show the approval reflected instantly (Supabase Realtime, no refresh)
Team → rep-wise activity summary





Time budget: roughly 12–15 minutes end-to-end if rehearsed — leaves room for evaluator questions within a typical 30-minute demo slot.

What's next


Swap the simulated Sage X3 step for a real integration once sandbox access exists
Build out the WhatsApp and voice-note pieces if the client wants them demoed live
rather than just described
Section 7 compliance matrix is a separate deliverable — this app supports the demo,
not the written RFP response