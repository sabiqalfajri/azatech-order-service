export type Product = {
  id: string;
  product_code: string;
  name: string;
  price: number;
  stock: number;
  created_at: string;
  updated_at: string;
};

export type ProductInput = {
  product_code: string;
  name: string;
  price: number;
  stock: number;
};

export type ProductListParams = {
  page: number;
  per_page: number;
  search?: string;
};