import { Card, Table, Button, Space, Typography, message } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { useOrderData } from "../hooks/useOrderData";
import { columns } from "./columnDefs";

const { Text } = Typography;

export const OrderBlotter = () => {
  const { data, isLoading, error, refetch, isFetching } = useOrderData();

  const orders = data?.orders || [];
  const count = data?.count || 0;

  if (error) {
    message.error(`Failed to fetch orders: ${error.message}`);
  }

  return (
    <Card
      title={
        <Space>
          <span>Order Blotter</span>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => refetch()}
            loading={isFetching}
            size="small"
          >
            Refresh
          </Button>
        </Space>
      }
      extra={
        <Text type="secondary">
          {count} order{count !== 1 ? "s" : ""}
        </Text>
      }
    >
      <Table
        columns={columns}
        dataSource={orders}
        rowKey="id"
        loading={isLoading}
        pagination={{
          pageSize: 10,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} orders`,
        }}
        scroll={{ x: 800 }}
        size="small"
      />
    </Card>
  );
};
