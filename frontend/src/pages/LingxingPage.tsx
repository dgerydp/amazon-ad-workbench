import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Card, Form, Input, Result, Space, Typography, message } from "antd";

import { api } from "../services/api";

const { Paragraph, Title } = Typography;

export function LingxingPage() {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: api.testLingxing,
  });

  const syncShops = useMutation({
    mutationFn: api.syncLingxingShops,
    onSuccess: async (data) => {
      message.success(`已同步店铺：${data.synced_shops ?? 0}`);
      await queryClient.invalidateQueries({ queryKey: ["shops"] });
    },
  });

  const syncSellerSkus = useMutation({
    mutationFn: (payload: { app_id?: string; app_secret?: string; base_url?: string }) => api.syncLingxingSellerSkus(payload),
    onSuccess: async (data) => {
      message.success(`已同步 sellerSKU：${data.synced_seller_skus ?? 0}`);
      await queryClient.invalidateQueries({ queryKey: ["seller-skus"] });
    },
  });

  return (
    <Space direction="vertical" size={24} style={{ display: "flex" }}>
      <div>
        <Title level={2}>领星同步</Title>
        <Paragraph>领星接入是可选能力。只有在你想同步店铺和 sellerSKU 基础资料时才需要这里，报表上传和分析本身并不依赖领星。</Paragraph>
      </div>

      <Alert
        type="info"
        showIcon
        message="建议"
        description="先把报表分析主流程跑通，再接领星。这样能把“数据同步问题”和“分析规则问题”拆开处理。"
      />

      <Card style={{ borderRadius: 18 }}>
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
              测试连接
            </Button>
            <Button onClick={() => syncShops.mutate(form.getFieldsValue())} loading={syncShops.isPending}>
              同步店铺
            </Button>
            <Button onClick={() => syncSellerSkus.mutate(form.getFieldsValue())} loading={syncSellerSkus.isPending}>
              同步 sellerSKU
            </Button>
          </Space>
        </Form>
      </Card>

      {mutation.data ? (
        <Result
          status={mutation.data.ok ? "success" : "warning"}
          title={mutation.data.ok ? "连接测试通过" : "连接测试失败"}
          subTitle={mutation.data.message}
        />
      ) : null}
    </Space>
  );
}
