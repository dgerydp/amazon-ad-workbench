import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Form, Input, Select, Space, Table, Typography, message } from "antd";

import { useLocale } from "../i18n/LocaleProvider";
import { api } from "../services/api";

const { Title, Paragraph } = Typography;

export function ShopsPage() {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const { t } = useLocale();
  const shops = useQuery({ queryKey: ["shops"], queryFn: api.listShops });
  const mutation = useMutation({
    mutationFn: api.createShop,
    onSuccess: () => {
      message.success(t("message.shopCreated"));
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ["shops"] });
    },
  });

  return (
    <Space direction="vertical" size={24} style={{ display: "flex" }}>
      <div>
        <Title level={2}>{t("shops.title")}</Title>
        <Paragraph>{t("shops.desc")}</Paragraph>
      </div>
      <Card style={{ borderRadius: 16 }}>
        <Form form={form} layout="vertical" onFinish={(values) => mutation.mutate(values)}>
          <Form.Item name="name" label={t("shops.shopName")} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="marketplace" label={t("common.marketplace")} rules={[{ required: true }]}>
            <Select options={["US", "CA", "UK", "DE", "FR", "IT", "ES", "JP"].map((value) => ({ value, label: value }))} />
          </Form.Item>
          <Form.Item name="currency" label={t("common.currency")} initialValue="USD">
            <Input />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={mutation.isPending}>
            {t("shops.create")}
          </Button>
        </Form>
      </Card>
      <Card title={t("shops.list")} style={{ borderRadius: 16 }}>
        <Table
          rowKey="id"
          dataSource={shops.data ?? []}
          columns={[
            { title: t("common.id"), dataIndex: "id" },
            { title: t("common.name"), dataIndex: "name" },
            { title: t("common.marketplace"), dataIndex: "marketplace" },
            { title: t("common.currency"), dataIndex: "currency" },
            { title: t("common.source"), dataIndex: "source" },
          ]}
        />
      </Card>
    </Space>
  );
}
