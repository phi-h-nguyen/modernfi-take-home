import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { TreasuryResponse } from "../types/api";

const API_URL = "http://127.0.0.1:5000"

export type UseTreasuryParams = {
  year?: string;
  years?: string[];
  startDate?: string;
  endDate?: string;
};

export type UseTreasuryOptions = {
  staleTime?: number;
  gcTime?: number;
};

function buildQueryString(p: UseTreasuryParams): string {
  const qs = new URLSearchParams();
  if (p.years?.length) qs.set("years", p.years.join(","));
  else if (p.year) qs.set("year", p.year);
  if (p.startDate) qs.set("start_date", p.startDate);
  if (p.endDate) qs.set("end_date", p.endDate);
  return qs.toString();
}

async function fetchTreasuryData(
  params: UseTreasuryParams,
): Promise<TreasuryResponse> {
  const qs = buildQueryString(params);
  const url = `${API_URL.replace(/\/$/, "")}/api/yields/treasury${qs ? `?${qs}` : ""}`;

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error || res.statusText || "Failed to fetch treasury yields");
  }
  return json as TreasuryResponse;
}

export function useTreasuryData(
  params: UseTreasuryParams = {},
  opts: UseTreasuryOptions = {}
): UseQueryResult<TreasuryResponse, Error> {
  const {
    staleTime = 5 * 60 * 1000,
    gcTime = 10 * 60 * 1000,
  } = opts;

  return useQuery<TreasuryResponse, Error>({
    queryKey: ["treasury", JSON.stringify(params)],
    staleTime,
    gcTime,
    queryFn: () => fetchTreasuryData(params),
  });
}
