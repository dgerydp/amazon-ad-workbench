import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Form, Select, Space, Table, Typography, Upload, message } from "antd";
import type { UploadFile } from "antd/es/upload/interface";

import { api } from "../services/api";

const { Title, Paragraph } = Typography;

export function UploadsPage() {
  const [form] = Form.useForm<{ shop_id?: number }>();
  const queryClient = useQueryClient();
  const shops = useQuery({ queryKey: ["shops"], queryFn: api.listShops });
  const batches = useQuery({ queryKey: ["batches"], queryFn: api.listBatches });

  const demoBootstrap = useMutation({
    mutationFn: () => api.bootstrapDemo({ reset: false, use_ai: false }),
    onSuccess: () => {
      message.success("Demo data loaded");
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      queryClient.invalidateQueries({ queryKey: ["shops"] });
      queryClient.invalidateQueries({ queryKey: ["seller-skus"] });
    },
  });

  const searchUpload = useMutation({
    mutationFn: ({ file, shopId }: { file: File; shopId?: number }) => api.uploadSearchTerms(file, shopId),
    onSuccess: () => {
      message.success("Search term report uploaded");
      queryClient.invalidateQueries({ queryKey: ["batches"] });
    },
  });

  const productUpload = useMutation({
    mutationFn: ({ file, shopId }: { file: File; shopId?: number }) => api.uploadAdvertisedProducts(file, shopId),
    onSuccess: () => {
      message.success("Advertised product report uploaded");
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
        <Title level={2}>Reports</Title>
        <Paragraph>
          Upload a Search Term Report and an Advertised Product Report. This project does not perform internal SKU mapping and
          works directly on sellerSKU.
        </Paragraph>
      </div>
      <Card style={{ borderRadius: 16 }}>
        <Form form={form} layout="vertical">
          <Form.Item name="shop_id" label="Linked Shop">
            <Select
              allowClear
              placeholder="Optional. Leave empty to import as global data"
              options={(shops.data ?? []).map((shop) => ({
                value: shop.id,
                label: `${shop.name} / ${shop.marketplace}`,
              }))}
            />
          </Form.Item>
          <Space wrap>
            <Upload beforeUpload={beforeUpload("search")} showUploadList={false}>
              <Button type="primary" loading={searchUpload.isPending}>
                Upload Search Term Report
              </Button>
            </Upload>
            <Upload beforeUpload={beforeUpload("product")} showUploadList={false}>
              <Button loading={productUpload.isPending}>Upload Advertised Product Report</Button>
            </Upload>
            <Button onClick={() => demoBootstrap.mutate()} loading={demoBootstrap.isPending}>
              Load Demo Data
            </Button>
          </Space>
        </Form>
      </Card>
      <Card title="Import Batches" style={{ borderRadius: 16 }}>
        <Table
          rowKey="id"
          dataSource={batches.data ?? []}
          columns={[
            { title: "ID", dataIndex: "id" },
            { title: "Type", dataIndex: "report_type" },
            { title: "Filename", dataIndex: "filename" },
            { title: "Status", dataIndex: "status" },
            { title: "Rows", dataIndex: "row_count" },
            { title: "Start", dataIndex: "date_range_start" },
            { title: "End", dataIndex: "date_range_end" },
          ]}
        />
      </Card>
    </Space>
  );
}
