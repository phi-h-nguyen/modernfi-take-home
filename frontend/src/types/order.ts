export type Side = "Buy" | "Sell";
export type IssuanceType = "WI" | "OTR" | "OFTR";
export type Tenor = "1M" | "1.5M" | "2M" | "3M" | "4M" | "6M" | "1Y" | "2Y" | "3Y" | "5Y" | "7Y" | "10Y" | "20Y" | "30Y";

export type OrderPayload = {
  side: Side;
  tenor: Tenor;
  issuanceType: IssuanceType;
  quantity: number;
  yield: number;
  notes?: string;
}

export type Order = {
  id: number;
  side: "Buy" | "Sell";
  tenor: string;
  issuance_type: "WI" | "OTR" | "OFTR";
  quantity: number;
  yield: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}
