import type { Order } from "./order";

export const API_URL = "http://127.0.0.1:5000"

export type YieldMap = Record<string, number>;

export type TreasuryResponse = {
  date: string;
  yields: YieldMap;
}

export type OrdersResponse = {
  orders: Order[];
  count: number;
}