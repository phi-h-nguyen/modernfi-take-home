import { Card } from "antd";
import { useTreasuryData } from "../hooks/useTreasuryData";
import { YieldCurveChart } from "./YieldCurveChart";

export const YieldsSection = () => {
  const { data, isLoading, error } = useTreasuryData({
    years: ["2024", "2025"],
    startDate: "2025-01-01",
    endDate: "2025-09-26",
  });

  if (isLoading) return <div>Loading…</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <Card>
      {data?.data[0].date}
      {data?.data[0].yields && <YieldCurveChart yields={data.data[0].yields} />}
    </Card>
  );
};
