import { Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Order } from "../types/order";
const { Text } = Typography;

const formatQuantity = (quantity: number) => {
  return new Intl.NumberFormat("en-US").format(quantity);
};

const formatYield = (yieldValue: number) => {
  return `${yieldValue.toFixed(2)}%`;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString();
};

export const columns: ColumnsType<Order> = [
  {
    title: "ID",
    dataIndex: "id",
    key: "id",
    width: 80,
    sorter: (a, b) => a.id - b.id,
  },
  {
    title: "Side",
    dataIndex: "side",
    key: "side",
    width: 80,
    render: (side: string) => (
      <Tag color={side === "Buy" ? "green" : "red"}>{side}</Tag>
    ),
    filters: [
      { text: "Buy", value: "Buy" },
      { text: "Sell", value: "Sell" },
    ],
    onFilter: (value, record) => record.side === value,
  },
  {
    title: "Tenor",
    dataIndex: "tenor",
    key: "tenor",
    width: 100,
    sorter: (a, b) => {
      // Custom sorting for tenor values
      const tenorOrder = [
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
      ];
      return tenorOrder.indexOf(a.tenor) - tenorOrder.indexOf(b.tenor);
    },
  },
  {
    title: "Issuance",
    dataIndex: "issuance_type",
    key: "issuance_type",
    width: 100,
    filters: [
      { text: "WI", value: "WI" },
      { text: "OTR", value: "OTR" },
      { text: "OFTR", value: "OFTR" },
    ],
    onFilter: (value, record) => record.issuance_type === value,
  },
  {
    title: "Quantity",
    dataIndex: "quantity",
    key: "quantity",
    width: 120,
    align: "right",
    render: (quantity: number) => <Text code>{formatQuantity(quantity)}</Text>,
    sorter: (a, b) => a.quantity - b.quantity,
  },
  {
    title: "Yield",
    dataIndex: "yield",
    key: "yield",
    width: 100,
    align: "right",
    render: (yieldValue: number) => (
      <Text strong>{formatYield(yieldValue)}</Text>
    ),
    sorter: (a, b) => a.yield - b.yield,
  },
  {
    title: "Notes",
    dataIndex: "notes",
    key: "notes",
    ellipsis: true,
    render: (notes: string) => (
      <Text ellipsis={{ tooltip: notes }} style={{ maxWidth: 150 }}>
        {notes || "-"}
      </Text>
    ),
  },
  {
    title: "Created",
    dataIndex: "created_at",
    key: "created_at",
    width: 180,
    render: (dateString: string) => formatDate(dateString),
    sorter: (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  },
];
