import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Form, Input, Select, Space, Table, Typography, message } from "antd";

import { api } from "../services/api";

const { Title, Paragraph } = Typography;

export function ShopsPage() {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const shops = useQuery({ queryKey: ["shops"], queryFn: api.listShops });
  const mutation = useMutation({
    mutationFn: api.createShop,
    onSuccess: () => {
      message.success("Shop created");
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ["shops"] });
    },
  });

  return (
    <Space direction="vertical" size={24} style={{ display: "flex" }}>
      <div>
        <Title level={2}>Shops</Title>
        <Paragraph>Manage shops manually here, or use the Lingxing connector to sync them from an external system.</Paragraph>
      </div>
      <Card style={{ borderRadius: 16 }}>
        <Form form={form} layout="vertical" onFinish={(values) => mutation.mutate(values)}>
          <Form.Item name="name" label="Shop Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="marketplace" label="Marketplace" rules={[{ required: true }]}>
            <Select options={["US", "CA", "UK", "DE", "FR", "IT", "ES", "JP"].map((value) => ({ value, label: value }))} />
          </Form.Item>
          <Form.Item name="currency" label="Currency" initialValue="USD">
            <Input />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={mutation.isPending}>
            Create Shop
          </Button>
        </Form>
      </Card>
      <Card title="Shop List" style={{ borderRadius: 16 }}>
        <Table
          rowKey="id"
          dataSource={shops.data ?? []}
          columns={[
            { title: "ID", dataIndex: "id" },
            { title: "Name", dataIndex: "name" },
            { title: "Marketplace", dataIndex: "marketplace" },
            { title: "Currency", dataIndex: "currency" },
            { title: "Source", dataIndex: "source" },
          ]}
        />
      </Card>
    </Space>
  );
}
