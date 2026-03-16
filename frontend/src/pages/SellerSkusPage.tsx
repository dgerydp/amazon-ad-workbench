import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Form, Input, InputNumber, Select, Space, Table, Typography, message } from "antd";

import { useLocale } from "../i18n/LocaleProvider";
import { api } from "../services/api";

const { Title, Paragraph } = Typography;

export function SellerSkusPage() {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const { t } = useLocale();
  const shops = useQuery({ queryKey: ["shops"], queryFn: api.listShops });
  const sellerSkus = useQuery({ queryKey: ["seller-skus"], queryFn: () => api.listSellerSkus() });
  const mutation = useMutation({
    mutationFn: api.createSellerSku,
    onSuccess: () => {
      message.success(t("message.skuCreated"));
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ["seller-skus"] });
    },
  });

  return (
    <Space direction="vertical" size={24} style={{ display: "flex" }}>
      <div>
        <Title level={2}>{t("sellerSku.title")}</Title>
        <Paragraph>{t("sellerSku.desc")}</Paragraph>
      </div>
      <Card style={{ borderRadius: 16 }}>
        <Form form={form} layout="vertical" onFinish={(values) => mutation.mutate(values)}>
          <Form.Item name="shop_id" label={t("common.shop")} rules={[{ required: true }]}>
            <Select options={(shops.data ?? []).map((shop) => ({ value: shop.id, label: `${shop.name} / ${shop.marketplace}` }))} />
          </Form.Item>
          <Form.Item name="seller_sku" label="sellerSKU" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="asin" label={t("common.asin")}>
            <Input />
          </Form.Item>
          <Form.Item name="title" label={t("common.title")}>
            <Input />
          </Form.Item>
          <Form.Item name="cost" label={t("common.cost")}>
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="inventory_qty" label={t("common.inventory")}>
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={mutation.isPending}>
            {t("sellerSku.create")}
          </Button>
        </Form>
      </Card>
      <Card title={t("sellerSku.list")} style={{ borderRadius: 16 }}>
        <Table
          rowKey="id"
          dataSource={sellerSkus.data ?? []}
          columns={[
            { title: "sellerSKU", dataIndex: "seller_sku" },
            { title: t("common.shopId"), dataIndex: "shop_id" },
            { title: t("common.asin"), dataIndex: "asin" },
            { title: t("common.title"), dataIndex: "title" },
            { title: t("common.cost"), dataIndex: "cost" },
            { title: t("common.inventory"), dataIndex: "inventory_qty" },
          ]}
        />
      </Card>
    </Space>
  );
}
