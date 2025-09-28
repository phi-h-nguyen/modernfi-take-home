import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { API_URL, type TreasuryResponse } from "../types/api";

export type UseTreasuryParams = {
  year?: string;
  years?: string[];
  startDate?: string;
  endDate?: string;
};

const buildQueryString = (p: UseTreasuryParams): string => {
  const qs = new URLSearchParams();
  if (p.years?.length) qs.set("years", p.years.join(","));
  else if (p.year) qs.set("year", p.year);
  if (p.startDate) qs.set("start_date", p.startDate);
  if (p.endDate) qs.set("end_date", p.endDate);
  return qs.toString();
}

const fetchTreasuryData = async (
  params: UseTreasuryParams,
): Promise<TreasuryResponse> => {
  const qs = buildQueryString(params);
  const url = `${API_URL}/api/yields/treasury${qs ? `?${qs}` : ""}`;

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error || res.statusText || "Failed to fetch treasury yields");
  }
  return json;
}

export const useTreasuryData = (
  params: UseTreasuryParams = {},
): UseQueryResult<TreasuryResponse, Error> => {
  // Cache timing options
  const staleTime = 5 * 60 * 1000;
  const gcTime = 10 * 60 * 1000;


  return useQuery<TreasuryResponse, Error>({
    queryKey: ["treasury", JSON.stringify(params)],
    staleTime,
    gcTime,
    queryFn: () => fetchTreasuryData(params),
  });
}
