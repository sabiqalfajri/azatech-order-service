export type OrderStatus = "PENDING" | "PAID" | "CANCELLED";

export type OrderItem = {
  id: string;
  product_id: string;
  product_name: string;
  product_code: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
};

export type Order = {
  id: string;
  order_number: string;
  status: OrderStatus;
  customer_id: string;
  subtotal: number;
  discount_amount: number;
  grand_total: number;
  created_at: string;
  updated_at: string;
  customer?: { id: string; name: string };
  items?: OrderItem[];
};

export type CreateOrderInput = {
  customer_id: string;
  items: { product_id: string; quantity: number }[];
};

export type OrderListParams = {
  page: number;
  per_page: number;
  status?: OrderStatus;
  date_from?: string; 
  date_to?: string; 
};