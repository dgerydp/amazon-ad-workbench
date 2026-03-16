import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Form, Select, Space, Table, Typography, Upload, message } from "antd";
import type { UploadFile } from "antd/es/upload/interface";

import { useLocale } from "../i18n/LocaleProvider";
import { api } from "../services/api";

const { Title, Paragraph } = Typography;

export function UploadsPage() {
  const [form] = Form.useForm<{ shop_id?: number }>();
  const queryClient = useQueryClient();
  const { t } = useLocale();
  const shops = useQuery({ queryKey: ["shops"], queryFn: api.listShops });
  const batches = useQuery({ queryKey: ["batches"], queryFn: api.listBatches });

  const demoBootstrap = useMutation({
    mutationFn: () => api.bootstrapDemo({ reset: false, use_ai: false }),
    onSuccess: () => {
      message.success(t("message.reportsDemoLoaded"));
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      queryClient.invalidateQueries({ queryKey: ["shops"] });
      queryClient.invalidateQueries({ queryKey: ["seller-skus"] });
    },
  });

  const searchUpload = useMutation({
    mutationFn: ({ file, shopId }: { file: File; shopId?: number }) => api.uploadSearchTerms(file, shopId),
    onSuccess: () => {
      message.success(t("message.searchUploaded"));
      queryClient.invalidateQueries({ queryKey: ["batches"] });
    },
  });

  const productUpload = useMutation({
    mutationFn: ({ file, shopId }: { file: File; shopId?: number }) => api.uploadAdvertisedProducts(file, shopId),
    onSuccess: () => {
      message.success(t("message.productUploaded"));
      queryClient.invalidateQueries({ queryKey: ["batches"] });
    },
  });

  const beforeUpload =
    (type: "search" | "product") =>
    async (file: File | UploadFile) => {
      const raw = file as File;
      const shopId = form.getFieldValue("shop_id");
      if (type === "search") {
        await searchUpload.mutateAsync({ file: raw, shopId });
      } else {
        await productUpload.mutateAsync({ file: raw, shopId });
      }
      return false;
    };

  return (
    <Space direction="vertical" size={24} style={{ display: "flex" }}>
      <div>
        <Title level={2}>{t("reports.title")}</Title>
        <Paragraph>{t("reports.desc")}</Paragraph>
      </div>
      <Card style={{ borderRadius: 16 }}>
        <Form form={form} layout="vertical">
          <Form.Item name="shop_id" label={t("reports.linkedShop")}>
            <Select
              allowClear
              placeholder={t("reports.linkedShopPlaceholder")}
              options={(shops.data ?? []).map((shop) => ({
                value: shop.id,
                label: `${shop.name} / ${shop.marketplace}`,
              }))}
            />
          </Form.Item>
          <Space wrap>
            <Upload beforeUpload={beforeUpload("search")} showUploadList={false}>
              <Button type="primary" loading={searchUpload.isPending}>
                {t("reports.uploadSearch")}
              </Button>
            </Upload>
            <Upload beforeUpload={beforeUpload("product")} showUploadList={false}>
              <Button loading={productUpload.isPending}>{t("reports.uploadProduct")}</Button>
            </Upload>
            <Button onClick={() => demoBootstrap.mutate()} loading={demoBootstrap.isPending}>
              {t("reports.loadDemo")}
            </Button>
          </Space>
        </Form>
      </Card>
      <Card title={t("reports.importBatches")} style={{ borderRadius: 16 }}>
        <Table
          rowKey="id"
          dataSource={batches.data ?? []}
          columns={[
            { title: t("common.id"), dataIndex: "id" },
            { title: t("common.type"), dataIndex: "report_type" },
            { title: t("common.filename"), dataIndex: "filename" },
            { title: t("common.status"), dataIndex: "status" },
            { title: t("common.rows"), dataIndex: "row_count" },
            { title: t("common.start"), dataIndex: "date_range_start" },
            { title: t("common.end"), dataIndex: "date_range_end" },
          ]}
        />
      </Card>
    </Space>
  );
}
