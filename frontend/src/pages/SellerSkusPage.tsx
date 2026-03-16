import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Form, Input, InputNumber, Select, Space, Table, Typography, message } from "antd";

import { api } from "../services/api";

const { Title, Paragraph } = Typography;

export function SellerSkusPage() {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const shops = useQuery({ queryKey: ["shops"], queryFn: api.listShops });
  const sellerSkus = useQuery({ queryKey: ["seller-skus"], queryFn: () => api.listSellerSkus() });
  const mutation = useMutation({
    mutationFn: api.createSellerSku,
    onSuccess: () => {
      message.success("sellerSKU created");
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ["seller-skus"] });
    },
  });

  return (
    <Space direction="vertical" size={24} style={{ display: "flex" }}>
      <div>
        <Title level={2}>sellerSKU</Title>
        <Paragraph>
          This project does not maintain internal SKU mappings. sellerSKU is the primary business key for attribution, tagging,
          and rule output.
        </Paragraph>
      </div>
      <Card style={{ borderRadius: 16 }}>
        <Form form={form} layout="vertical" onFinish={(values) => mutation.mutate(values)}>
          <Form.Item name="shop_id" label="Shop" rules={[{ required: true }]}>
            <Select options={(shops.data ?? []).map((shop) => ({ value: shop.id, label: `${shop.name} / ${shop.marketplace}` }))} />
          </Form.Item>
          <Form.Item name="seller_sku" label="sellerSKU" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="asin" label="ASIN">
            <Input />
          </Form.Item>
          <Form.Item name="title" label="Title">
            <Input />
          </Form.Item>
          <Form.Item name="cost" label="Cost">
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="inventory_qty" label="Inventory">
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={mutation.isPending}>
            Create sellerSKU
          </Button>
        </Form>
      </Card>
      <Card title="sellerSKU List" style={{ borderRadius: 16 }}>
        <Table
          rowKey="id"
          dataSource={sellerSkus.data ?? []}
          columns={[
            { title: "sellerSKU", dataIndex: "seller_sku" },
            { title: "Shop ID", dataIndex: "shop_id" },
            { title: "ASIN", dataIndex: "asin" },
            { title: "Title", dataIndex: "title" },
            { title: "Cost", dataIndex: "cost" },
            { title: "Inventory", dataIndex: "inventory_qty" },
          ]}
        />
      </Card>
    </Space>
  );
}
