import { Button, Card, DatePicker } from "antd";
import { useTreasuryData } from "../hooks/useTreasuryData";
import { YieldCurveChart } from "./YieldCurveChart";
import { useState } from "react";
import { RingLoader } from "react-spinners";
import { styled } from "@stitches/react";
import { disableWeekends, getLastBusinessDay } from "../utils";

const Container = styled(Card, {
  display: "flex",
  justifyContent: "center",
  width: "100%",
  ".ant-card-body": {
    width: "100%",
    display: "flex",
    justifyContent: "center",
  },
});

const DatePickerWrapper = styled("div", {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  marginBottom: 16,
});

export const YieldsSection = () => {
  const [date, setDate] = useState(getLastBusinessDay());

  const { data, isLoading, error } = useTreasuryData({
    date: date.format("YYYY-MM-DD"),
  });

  const Content = () => {
    if (isLoading) {
      return <RingLoader />;
    }
    if (error) {
      return <>Error: {error.message}</>;
    }
    if (data?.yields) {
      return <YieldCurveChart yields={data.yields} />;
    }
    return <>No data available for this day.</>;
  };

  return (
    <Card title="Treasury Yield Data">
      <DatePickerWrapper>
        <DatePicker
          value={date}
          onChange={setDate}
          allowClear={false}
          maxDate={getLastBusinessDay()}
          disabledDate={disableWeekends}
        />
        <Button onClick={() => setDate(getLastBusinessDay())}>Today</Button>
      </DatePickerWrapper>

      <Container>
        <Content />
      </Container>
    </Card>
  );
};
