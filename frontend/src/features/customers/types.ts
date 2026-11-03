export type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
};

export type CustomerListParams = { page: number; per_page: number; search?: string };