export interface OpenInvoice {
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  amount: number;
  currency: string;
  days_overdue: number;
  status: "current" | "overdue_30" | "overdue_60" | "overdue_90_plus";
}

export interface CustomerArAging {
  customer_id: string;
  total_outstanding: number;
  credit_limit: number;
  credit_utilization_pct: number;
  currency: string;
  dso_days: number; // Days Sales Outstanding
  aging: {
    current: number;      // 0 - 30 days
    overdue_30: number;   // 31 - 60 days
    overdue_60: number;   // 61 - 90 days
    overdue_90_plus: number; // 90+ days
  };
  open_invoices: OpenInvoice[];
}

export interface SlowMovingStockItem {
  product_id: string;
  sku: string;
  name: string;
  category: string;
  last_ordered_date: string;
  days_since_last_order: number;
  historical_order_cadence_days: number;
  dormancy_status: "active" | "at_risk" | "dormant";
  estimated_days_of_supply: number;
  unit_price: number;
}

export interface BatchExpiryItem {
  product_id: string;
  sku: string;
  name: string;
  lot_number: string;
  warehouse_location: string;
  available_units: number;
  expiry_date: string;
  days_to_expiry: number;
  discount_eligible: boolean;
  recommended_discount_pct: number;
}

export interface Customer360MockData {
  customer_id: string;
  ar_aging: CustomerArAging;
  slow_moving_stock: SlowMovingStockItem[];
  batch_expiry_alerts: BatchExpiryItem[];
  frequent_products: {
    product_id: string;
    sku: string;
    name: string;
    avg_reorder_interval_days: number;
    avg_order_qty: number;
    last_purchased: string;
  }[];
}

export interface SageWebhookPayload {
  event_id: string;
  event_type: "discount.approved" | "discount.rejected" | "order.confirmed" | "order.in_warehouse" | "order.dispatched" | "order.invoiced";
  entity_type: "discount_request" | "order";
  entity_id: string;
  sage_reference_no: string;
  status: string;
  approver_name?: string;
  rejection_reason?: string;
  timestamp: string;
}
