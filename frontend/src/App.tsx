import { OrderBlotter } from "./components/OrderBlotter";
import { OrderForm } from "./components/OrderForm";
import { YieldsSection } from "./components/YieldsSection";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { styled } from "@stitches/react";
import Title from "antd/es/typography/Title";
import "@ant-design/v5-patch-for-react-19";

const Wrapper = styled("div", {
  display: "flex",
  flexDirection: "column",
  gap: 8,
});

const Section = styled("div", {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 8,
});

function App() {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <Title>ModernFi Treasury Liquidity</Title>
      <Wrapper>
        <Section>
          <YieldsSection />
          <OrderForm />
        </Section>
        <OrderBlotter />
      </Wrapper>
    </QueryClientProvider>
  );
}

export default App;
