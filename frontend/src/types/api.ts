
/** Raw API types from your Flask endpoint */
export type YieldMap = Record<string, number>;
export interface APIDay {
  date: string;           // "MM/DD/YYYY"
  yields: YieldMap;       // e.g., { "1 Mo": 565, "2 Yr": 458, ... }
}
export interface TreasuryResponse {
  source: string;         // "treasury.gov"
  years: string[];
  data: APIDay[];
  count: number;
  date_range: { start_date?: string | null; end_date?: string | null };
}