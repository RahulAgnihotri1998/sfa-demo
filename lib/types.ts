export type UserRole = "sales_rep" | "manager" | "admin";

export interface AppUser {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  territory: string | null;
  manager_id: string | null;
}

export interface Customer {
  id: string;
  name: string;
  territory: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  geofence_radius_m: number;
  open_items_amount: number;
  status: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string | null;
  base_price: number;
  stock_status: "active" | "near_expiry" | "promo" | "out_of_stock" | "non_moving";
  is_promotion: boolean;
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}
