import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Form, Input, Result, Space, Typography, message } from "antd";

import { useLocale } from "../i18n/LocaleProvider";
import { api } from "../services/api";

const { Title, Paragraph } = Typography;

export function LingxingPage() {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const { t } = useLocale();

  const mutation = useMutation({
    mutationFn: api.testLingxing,
  });

  const syncShops = useMutation({
    mutationFn: api.syncLingxingShops,
    onSuccess: (data) => {
      message.success(t("message.syncShops", { count: data.synced_shops ?? 0 }));
      queryClient.invalidateQueries({ queryKey: ["shops"] });
    },
  });

  const syncSellerSkus = useMutation({
    mutationFn: (payload: { app_id?: string; app_secret?: string; base_url?: string }) =>
      api.syncLingxingSellerSkus(payload),
    onSuccess: (data) => {
      message.success(t("message.syncSku", { count: data.synced_seller_skus ?? 0 }));
      queryClient.invalidateQueries({ queryKey: ["seller-skus"] });
    },
  });

  return (
    <Space direction="vertical" size={24} style={{ display: "flex" }}>
      <div>
        <Title level={2}>{t("lingxing.title")}</Title>
        <Paragraph>{t("lingxing.desc")}</Paragraph>
      </div>
      <Card style={{ borderRadius: 16 }}>
        <Form form={form} layout="vertical" onFinish={(values) => mutation.mutate(values)}>
          <Form.Item name="app_id" label={t("lingxing.appId")}>
            <Input />
          </Form.Item>
          <Form.Item name="app_secret" label={t("lingxing.appSecret")}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="base_url" label={t("common.baseUrl")} initialValue="https://openapi.lingxing.com">
            <Input />
          </Form.Item>
          <Space wrap>
            <Button type="primary" htmlType="submit" loading={mutation.isPending}>
              {t("common.testConnection")}
            </Button>
            <Button onClick={() => syncShops.mutate(form.getFieldsValue())} loading={syncShops.isPending}>
              {t("lingxing.syncShops")}
            </Button>
            <Button onClick={() => syncSellerSkus.mutate(form.getFieldsValue())} loading={syncSellerSkus.isPending}>
              {t("lingxing.syncSku")}
            </Button>
          </Space>
        </Form>
      </Card>

      {mutation.data ? (
        <Result
          status={mutation.data.ok ? "success" : "warning"}
          title={mutation.data.ok ? t("lingxing.success") : t("lingxing.failed")}
          subTitle={mutation.data.message}
        />
      ) : null}
    </Space>
  );
}
