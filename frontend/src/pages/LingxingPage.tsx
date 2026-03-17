import { ApartmentOutlined, CloudSyncOutlined, LinkOutlined, ShopOutlined } from "@ant-design/icons";
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
    <Space direction="vertical" size={24} style={{ display: "flex" }} className="page-layout">
      <section className="page-hero">
        <div className="page-hero-main">
          <div className="page-kicker">LingXing Connector</div>
          <Title className="page-title">把领星当作基础资料同步器，而不是主流程依赖</Title>
          <Paragraph className="page-summary">
            领星接入是可选能力。只有在你想同步店铺和 sellerSKU 基础资料时才需要这里，报表上传和分析本身并不依赖领星。
          </Paragraph>
          <div className="page-chip-row">
            <div className="page-chip">连接测试</div>
            <div className="page-chip">同步店铺</div>
            <div className="page-chip">同步 sellerSKU</div>
          </div>
        </div>

        <aside className="page-hero-side">
          <div className="page-side-kicker">Connector Pulse</div>
          <div className="page-side-value">{mutation.data?.ok ? "OK" : "API"}</div>
          <div className="page-side-copy">先验证接口，再执行同步动作</div>
          <div className="page-side-grid">
            <div className="page-side-metric">
              <span>连接测试</span>
              <strong>{mutation.data ? (mutation.data.ok ? "PASS" : "WARN") : "-"}</strong>
            </div>
            <div className="page-side-metric">
              <span>店铺同步</span>
              <strong>{syncShops.isPending ? "RUN" : "IDLE"}</strong>
            </div>
            <div className="page-side-metric">
              <span>SKU 同步</span>
              <strong>{syncSellerSkus.isPending ? "RUN" : "IDLE"}</strong>
            </div>
            <div className="page-side-metric">
              <span>用途</span>
              <strong>Base</strong>
            </div>
          </div>
        </aside>
      </section>

      <Alert
        type="info"
        showIcon
        message="建议"
        description="先把报表分析主流程跑通，再接领星。这样能把“数据同步问题”和“分析规则问题”拆开处理。"
      />

      <div className="page-dual-grid">
        <Card className="page-section-card" title="连接配置">
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
              <Button type="primary" htmlType="submit" loading={mutation.isPending} icon={<LinkOutlined />}>
                测试连接
              </Button>
              <Button onClick={() => syncShops.mutate(form.getFieldsValue())} loading={syncShops.isPending} icon={<ShopOutlined />}>
                同步店铺
              </Button>
              <Button onClick={() => syncSellerSkus.mutate(form.getFieldsValue())} loading={syncSellerSkus.isPending} icon={<CloudSyncOutlined />}>
                同步 sellerSKU
              </Button>
            </Space>
          </Form>
        </Card>

        <Card title="同步动作说明" className="page-section-card">
          <div className="page-action-grid">
            <div className="page-action-card">
              <div className="page-action-icon">
                <LinkOutlined />
              </div>
              <div className="page-action-title">先测连接</div>
              <div className="page-action-copy">先确认凭据和地址没问题，再避免把同步失败误判成业务问题。</div>
            </div>
            <div className="page-action-card">
              <div className="page-action-icon">
                <ApartmentOutlined />
              </div>
              <div className="page-action-title">同步店铺</div>
              <div className="page-action-copy">把店铺基础信息带进系统，用于导入时关联归属和数据隔离。</div>
            </div>
            <div className="page-action-card">
              <div className="page-action-icon">
                <CloudSyncOutlined />
              </div>
              <div className="page-action-title">同步 sellerSKU</div>
              <div className="page-action-copy">补齐 SKU 基础资料，方便 sellerSKU-first 的归因和分析链路更稳定。</div>
            </div>
          </div>
        </Card>
      </div>

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
