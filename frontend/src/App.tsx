import "./App.css";
import { OrderBlotter } from "./components/OrderBlotter";
import { OrderForm } from "./components/OrderForm";
import { YieldsSection } from "./components/YieldsSection";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  ResizableContainer,
  useResize,
  LeftPanel,
  RightPanel,
  Resizer,
} from "./hooks/useResize";

function App() {
  const queryClient = new QueryClient();
  const { leftWidth, containerRef, startResizing, resizing } = useResize();

  return (
    <QueryClientProvider client={queryClient}>
      <ResizableContainer ref={containerRef} resizing={resizing}>
        <LeftPanel style={{ width: leftWidth }} padded>
          <YieldsSection />
        </LeftPanel>
        <Resizer onMouseDown={startResizing} />
        <RightPanel padded>
          <OrderForm />
          <OrderBlotter />
        </RightPanel>
      </ResizableContainer>
    </QueryClientProvider>
  );
}

export default App;
