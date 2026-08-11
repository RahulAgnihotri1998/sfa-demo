import { 
  Customer360MockData, 
  CustomerArAging, 
  SlowMovingStockItem, 
  BatchExpiryItem, 
  SageWebhookPayload 
} from "./types";

/**
 * Mock Sage X3 ERP Service
 * Simulates Sage X3 financial, stock, and workflow services without live ERP dependencies.
 */
export class MockSageX3Service {
  /**
   * Generates deterministic, realistic Customer 360 insights (AR, slow-moving stock, lot expiry)
   */
  static getCustomer360(customerId: string, customerName: string = "Customer"): Customer360MockData {
    // Generate pseudorandom but stable numbers based on customer ID string
    const hash = customerId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    const creditLimit = (hash % 5 + 3) * 10000; // 30,000 to 70,000 AED
    const totalOutstanding = Math.round(creditLimit * (0.35 + (hash % 50) / 100));
    
    const overdue90 = hash % 3 === 0 ? Math.round(totalOutstanding * 0.15) : 0;
    const overdue60 = hash % 2 === 0 ? Math.round(totalOutstanding * 0.20) : 0;
    const overdue30 = Math.round(totalOutstanding * 0.25);
    const current = totalOutstanding - (overdue30 + overdue60 + overdue90);

    const now = new Date();
    const subDays = (days: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() - days);
      return d.toISOString().split("T")[0];
    };
    const addDays = (days: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() + days);
      return d.toISOString().split("T")[0];
    };

    const ar_aging: CustomerArAging = {
      customer_id: customerId,
      total_outstanding: totalOutstanding,
      credit_limit: creditLimit,
      credit_utilization_pct: Math.round((totalOutstanding / creditLimit) * 100),
      currency: "AED",
      dso_days: 38 + (hash % 20),
      aging: {
        current: Math.max(0, current),
        overdue_30: overdue30,
        overdue_60: overdue60,
        overdue_90_plus: overdue90,
      },
      open_invoices: [
        {
          invoice_number: `INV-2026-${1000 + (hash % 800)}`,
          invoice_date: subDays(45),
          due_date: subDays(15),
          amount: overdue30,
          currency: "AED",
          days_overdue: 15,
          status: "overdue_30",
        },
        ...(overdue60 > 0 ? [{
          invoice_number: `INV-2026-${1000 + ((hash + 50) % 800)}`,
          invoice_date: subDays(75),
          due_date: subDays(45),
          amount: overdue60,
          currency: "AED",
          days_overdue: 45,
          status: "overdue_60" as const,
        }] : []),
        {
          invoice_number: `INV-2026-${1000 + ((hash + 120) % 800)}`,
          invoice_date: subDays(10),
          due_date: addDays(20),
          amount: Math.max(0, current),
          currency: "AED",
          days_overdue: 0,
          status: "current",
        }
      ],
    };

    const slow_moving_stock: SlowMovingStockItem[] = [
      {
        product_id: "a0000001-0000-0000-0000-000000000003",
        sku: "DW-130-01",
        name: "Confibel Apricot Jam 13kg Pail",
        category: "Fruit Jams & Pastes",
        last_ordered_date: subDays(52),
        days_since_last_order: 52,
        historical_order_cadence_days: 28,
        dormancy_status: "dormant",
        estimated_days_of_supply: 4,
        unit_price: 195,
      },
      {
        product_id: "a0000001-0000-0000-0000-000000000006",
        sku: "FB-250-04",
        name: "Top Croccante – Decorations 2.5kg",
        category: "Gourmet Sauces & Flavours",
        last_ordered_date: subDays(39),
        days_since_last_order: 39,
        historical_order_cadence_days: 25,
        dormancy_status: "at_risk",
        estimated_days_of_supply: 8,
        unit_price: 130,
      },
      {
        product_id: "a0000001-0000-0000-0000-000000000014",
        sku: "LES-100-01",
        name: "AROME LEVAIN® Liquid Formula 10kg",
        category: "Sourdough & Yeast",
        last_ordered_date: subDays(18),
        days_since_last_order: 18,
        historical_order_cadence_days: 20,
        dormancy_status: "active",
        estimated_days_of_supply: 22,
        unit_price: 215,
      }
    ];

    const batch_expiry_alerts: BatchExpiryItem[] = [
      {
        product_id: "a0000001-0000-0000-0000-000000000001",
        sku: "FB-950-01",
        name: "Amarena Fabbri Gourmet Sauce 950g",
        lot_number: "LOT-2026-AUG-881",
        warehouse_location: "Dubai Central DC - Bay 4",
        available_units: 140,
        expiry_date: addDays(18),
        days_to_expiry: 18,
        discount_eligible: true,
        recommended_discount_pct: 20,
      },
      {
        product_id: "a0000001-0000-0000-0000-000000000003",
        sku: "DW-130-01",
        name: "Confibel Apricot Jam 13kg Pail",
        lot_number: "LOT-2026-SEP-104",
        warehouse_location: "Dubai Central DC - Bay 2",
        available_units: 45,
        expiry_date: addDays(32),
        days_to_expiry: 32,
        discount_eligible: true,
        recommended_discount_pct: 15,
      }
    ];

    const frequent_products = [
      {
        product_id: "a0000001-0000-0000-0000-000000000008",
        sku: "DW-600-02",
        name: "Chocolate Frosting 6kg Pail",
        avg_reorder_interval_days: 14,
        avg_order_qty: 6,
        last_purchased: subDays(12),
      },
      {
        product_id: "a0000001-0000-0000-0000-000000000005",
        sku: "FB-150-03",
        name: "Delipaste – Salted Butter Caramel 1.5kg",
        avg_reorder_interval_days: 21,
        avg_order_qty: 4,
        last_purchased: subDays(16),
      },
      {
        product_id: "a0000001-0000-0000-0000-000000000012",
        sku: "SCH-405-02",
        name: "Wheat Flour – Type 405 25kg",
        avg_reorder_interval_days: 10,
        avg_order_qty: 20,
        last_purchased: subDays(8),
      }
    ];

    return {
      customer_id: customerId,
      ar_aging,
      slow_moving_stock,
      batch_expiry_alerts,
      frequent_products,
    };
  }

  /**
   * Simulates an inbound Sage X3 Webhook payload for testing two-way status write-backs
   */
  static createMockWebhookPayload(
    entityType: "discount_request" | "order",
    entityId: string,
    action: "approve" | "reject" | "dispatch" | "invoice"
  ): SageWebhookPayload {
    const eventId = `EVT-X3-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const sageRef = `SAGE-${Date.now().toString().slice(-6)}`;

    let event_type: SageWebhookPayload["event_type"] = "order.confirmed";
    let status = "confirmed";
    let approver_name = "Commercial Director (Sage X3 Auto-Sync)";
    let rejection_reason: string | undefined = undefined;

    if (entityType === "discount_request") {
      if (action === "approve") {
        event_type = "discount.approved";
        status = "approved";
      } else {
        event_type = "discount.rejected";
        status = "rejected";
        rejection_reason = "Discount exceeds branch delegation limit (Max allowed: 15%).";
      }
    } else if (entityType === "order") {
      if (action === "dispatch") {
        event_type = "order.dispatched";
        status = "dispatched";
      } else if (action === "invoice") {
        event_type = "order.invoiced";
        status = "invoiced";
      }
    }

    return {
      event_id: eventId,
      event_type,
      entity_type: entityType,
      entity_id: entityId,
      sage_reference_no: sageRef,
      status,
      approver_name,
      rejection_reason,
      timestamp: new Date().toISOString(),
    };
  }
}
