import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Form, Input, Result, Space, Typography, message } from "antd";

import { api } from "../services/api";

const { Title, Paragraph } = Typography;

export function LingxingPage() {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: api.testLingxing,
  });

  const syncShops = useMutation({
    mutationFn: api.syncLingxingShops,
    onSuccess: (data) => {
      message.success(`Synced shops: ${data.synced_shops ?? 0}`);
      queryClient.invalidateQueries({ queryKey: ["shops"] });
    },
  });

  const syncSellerSkus = useMutation({
    mutationFn: (payload: { app_id?: string; app_secret?: string; base_url?: string }) =>
      api.syncLingxingSellerSkus(payload),
    onSuccess: (data) => {
      message.success(`Synced sellerSKU rows: ${data.synced_seller_skus ?? 0}`);
      queryClient.invalidateQueries({ queryKey: ["seller-skus"] });
    },
  });

  return (
    <Space direction="vertical" size={24} style={{ display: "flex" }}>
      <div>
        <Title level={2}>Lingxing</Title>
        <Paragraph>
          The project does not depend on Lingxing, but you can connect it to sync shops and sellerSKU base data for richer
          analysis output.
        </Paragraph>
      </div>
      <Card style={{ borderRadius: 16 }}>
        <Form form={form} layout="vertical" onFinish={(values) => mutation.mutate(values)}>
          <Form.Item name="app_id" label="App ID">
            <Input />
          </Form.Item>
          <Form.Item name="app_secret" label="App Secret">
            <Input.Password />
          </Form.Item>
          <Form.Item name="base_url" label="Base URL" initialValue="https://openapi.lingxing.com">
            <Input />
          </Form.Item>
          <Space wrap>
            <Button type="primary" htmlType="submit" loading={mutation.isPending}>
              Test Connection
            </Button>
            <Button onClick={() => syncShops.mutate(form.getFieldsValue())} loading={syncShops.isPending}>
              Sync Shops
            </Button>
            <Button onClick={() => syncSellerSkus.mutate(form.getFieldsValue())} loading={syncSellerSkus.isPending}>
              Sync sellerSKU
            </Button>
          </Space>
        </Form>
      </Card>

      {mutation.data ? (
        <Result
          status={mutation.data.ok ? "success" : "warning"}
          title={mutation.data.ok ? "Connection test passed" : "Connection test failed"}
          subTitle={mutation.data.message}
        />
      ) : null}
    </Space>
  );
}
