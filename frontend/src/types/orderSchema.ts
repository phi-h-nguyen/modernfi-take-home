import { z } from "zod";

export const orderSchema = z.object({
  side: z.enum(["Buy", "Sell"]),
  tenor: z.enum([
    "1M", "1.5M", "2M", "3M", "4M", "6M",
    "1Y", "2Y", "3Y", "5Y", "7Y", "10Y", "20Y", "30Y"
  ]),
  issuanceType: z.enum(["WI", "OTR", "OFTR"]),
  quantity: z
    .number()
    .int()
    .positive()
    .refine((val) => val % 1000 === 0, {
      message: "Quantity must be a multiple of 1000",
    }),
  yield: z.number().positive(),
  notes: z.string().max(1000).optional(),
});

export type OrderFormValues = z.infer<typeof orderSchema>;
