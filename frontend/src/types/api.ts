import type { Order } from "./order";

export const API_URL = "http://127.0.0.1:5000"

export type YieldMap = Record<string, number>;
export type APIDay = {
  date: string;
  yields: YieldMap;
}
export type TreasuryResponse = {
  years: string[];
  data: APIDay[];
  count: number;
  date_range: { start_date?: string | null; end_date?: string | null };
}

export type OrdersResponse = {
  orders: Order[];
  count: number;
}