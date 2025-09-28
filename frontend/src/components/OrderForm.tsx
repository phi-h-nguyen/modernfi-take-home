// OrderForm.tsx
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Input,
  InputNumber,
  Select,
  Button,
  Space,
  Typography,
  Card,
  message,
} from "antd";
import { useEffect, useState } from "react";
const { Text } = Typography;
import { orderSchema, type OrderFormValues } from "../types/orderSchema";
import { styled } from "@stitches/react";
import { API_URL } from "../types/api";
import { useTreasuryData } from "../hooks/useTreasuryData";
import { lastBusinessDayISO } from "../utils";

const tenorOptions = [
  "1M",
  "1.5M",
  "2M",
  "3M",
  "4M",
  "6M",
  "1Y",
  "2Y",
  "3Y",
  "5Y",
  "7Y",
  "10Y",
  "20Y",
  "30Y",
].map((v) => ({ value: v, label: v }));

/**
 * Turn codes like "1M", "1.5M", "2Y" into backend keys:
 * "1 Mo", "1.5 Month", "2 Yr", etc.
 */
const formatTenor = (code: string): string => {
  const m = /^(\d+(?:\.\d+)?)([MY])$/i.exec(code.trim());
  if (!m) return code; // fallback

  const [, num, unit] = m;
  if (unit.toUpperCase() === "M") {
    return num.includes(".") ? `${num} Month` : `${num} Mo`;
  }
  return `${num} Yr`;
};

const StyledCard = styled(Card, {
  outline: "5px solid",
  outlineOffset: "-5px",

  variants: {
    side: {
      Buy: {
        outlineColor: "#52c41a",
      },
      Sell: {
        outlineColor: "#f5222d",
      },
    },
  },
});

export const OrderForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data } = useTreasuryData({
    date: lastBusinessDayISO(),
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      side: "Buy",
      tenor: "10Y",
      issuanceType: "OTR",
      quantity: 1000,
      yield: undefined,
      notes: "",
    },
    mode: "onBlur",
  });

  const side = watch("side");
  const tenor = watch("tenor");

  useEffect(() => {
    const yieldData = data?.yields;
    if (!tenor || !yieldData) return;
    const key = formatTenor(tenor);
    const raw = yieldData[key];
    const val = Number((raw / 100).toFixed(2));
    if (typeof val === "number" && !Number.isNaN(val)) {
      setValue("yield", val, { shouldValidate: true, shouldDirty: true });
    }
  }, [tenor, setValue, data?.yields]);

  const submit = async (vals: OrderFormValues) => {
    setIsSubmitting(true);
    try {
      const orderData = {
        side: vals.side,
        tenor: vals.tenor,
        issuance_type: vals.issuanceType,
        quantity: vals.quantity,
        yield: vals.yield,
        notes: vals.notes || "",
      };

      const response = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const result = await response.json();
        message.success(
          `Order created successfully! Order ID: ${result.order_id}`
        );
      } else {
        const error = await response.json();
        message.error(
          `Failed to create order: ${error.error || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("Error submitting order:", error);
      message.error("Network error: Unable to submit order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Prevents form submission on enter in inputs
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  return (
    <StyledCard title="Order Form" side={side}>
      <form onSubmit={handleSubmit(submit)} onKeyDown={handleKeyDown}>
        <Space direction="vertical" size="small">
          <Space wrap>
            <div>
              <Text strong>Side</Text>
              <Controller
                control={control}
                name="side"
                render={({ field }) => (
                  <Select
                    {...field}
                    style={{ width: 140, display: "block" }}
                    options={[
                      { value: "Buy", label: "Buy" },
                      { value: "Sell", label: "Sell" },
                    ]}
                  />
                )}
              />
            </div>

            <div>
              <Text strong>Tenor</Text>
              <Controller
                control={control}
                name="tenor"
                render={({ field }) => (
                  <Select
                    {...field}
                    style={{ width: 140, display: "block" }}
                    options={tenorOptions}
                  />
                )}
              />
            </div>

            <div>
              <Text strong>Issuance Type</Text>
              <Controller
                control={control}
                name="issuanceType"
                render={({ field }) => (
                  <Select
                    {...field}
                    style={{ width: 120, display: "block" }}
                    options={[
                      { value: "WI", label: "WI" },
                      { value: "OTR", label: "OTR" },
                      { value: "OFTR", label: "OFTR" },
                    ]}
                  />
                )}
              />
            </div>
          </Space>

          <Space wrap>
            <div>
              <Text strong>Quantity</Text>
              <Controller
                control={control}
                name="quantity"
                render={({ field }) => (
                  <InputNumber
                    {...field}
                    controls
                    style={{ width: 240, display: "block" }}
                    step={1000}
                    min={1000}
                  />
                )}
              />
            </div>
          </Space>
          {errors.quantity && (
            <div style={{ color: "crimson" }}>{errors.quantity.message}</div>
          )}

          <Space wrap>
            <div>
              <Text strong>Yield (%)</Text>
              <Controller
                control={control}
                name="yield"
                render={({ field }) => (
                  <InputNumber
                    {...field}
                    placeholder="Yield (%)"
                    style={{ width: 180, display: "block" }}
                    min={0.01}
                    step={0.01}
                  />
                )}
              />
            </div>
          </Space>
          {errors.yield && (
            <div style={{ color: "crimson" }}>{errors.yield?.message}</div>
          )}

          <div>
            <Text strong>Notes</Text>
            <Controller
              control={control}
              name="notes"
              render={({ field }) => (
                <Input.TextArea
                  {...field}
                  rows={3}
                  placeholder="Trader notes / tags"
                  style={{ display: "block" }}
                />
              )}
            />
          </div>

          <Button
            type="primary"
            htmlType="submit"
            loading={isSubmitting}
            color={side == "Buy" ? "green" : "red"}
            variant="filled"
          >
            Submit Order
          </Button>
        </Space>
      </form>
    </StyledCard>
  );
};
