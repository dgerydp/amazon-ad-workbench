import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Card, Form, Popconfirm, Select, Space, Table, Typography, Upload, message } from "antd";
import type { UploadFile } from "antd/es/upload/interface";

import { api } from "../services/api";

const { Paragraph, Title } = Typography;

const batchTypeLabels: Record<string, string> = {
  advertised_product: "投放商品报表",
  search_term: "搜索词报表",
};

const batchStatusLabels: Record<string, string> = {
  completed: "已完成",
  failed: "失败",
  processing: "处理中",
};

export function UploadsPage() {
  const [form] = Form.useForm<{ shop_id?: number }>();
  const queryClient = useQueryClient();
  const shops = useQuery({ queryKey: ["shops"], queryFn: api.listShops });
  const batches = useQuery({ queryKey: ["batches"], queryFn: api.listBatches });

  const refreshAfterBatchChange = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["batches"] }),
      queryClient.invalidateQueries({ queryKey: ["overview"] }),
      queryClient.invalidateQueries({ queryKey: ["analysis-jobs"] }),
      queryClient.invalidateQueries({ queryKey: ["tokens"] }),
      queryClient.invalidateQueries({ queryKey: ["search-terms"] }),
      queryClient.invalidateQueries({ queryKey: ["rule-hits"] }),
      queryClient.invalidateQueries({ queryKey: ["seller-sku-insights"] }),
      queryClient.invalidateQueries({ queryKey: ["tag-summary"] }),
    ]);
  };

  const searchUpload = useMutation({
    mutationFn: ({ file, shopId }: { file: File; shopId?: number }) => api.uploadSearchTerms(file, shopId),
    onSuccess: async () => {
      message.success("搜索词报表已上传");
      await refreshAfterBatchChange();
    },
    onError: (error: unknown) => {
      const detail = error instanceof Error ? error.message : "上传失败";
      message.error(detail);
    },
  });

  const productUpload = useMutation({
    mutationFn: ({ file, shopId }: { file: File; shopId?: number }) => api.uploadAdvertisedProducts(file, shopId),
    onSuccess: async () => {
      message.success("投放商品报表已上传");
      await refreshAfterBatchChange();
    },
    onError: (error: unknown) => {
      const detail = error instanceof Error ? error.message : "上传失败";
      message.error(detail);
    },
  });

  const deleteBatch = useMutation({
    mutationFn: api.deleteBatch,
    onSuccess: async () => {
      message.success("批次已删除，同时已清空分析派生数据");
      await refreshAfterBatchChange();
    },
  });

  const clearBatches = useMutation({
    mutationFn: api.clearBatches,
    onSuccess: async () => {
      message.success("导入批次和分析派生数据已清空");
      await refreshAfterBatchChange();
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
        <Title level={2}>报表上传</Title>
        <Paragraph>
          上传搜索词报表和投放商品报表后，就可以直接基于报表里的 SKU 做归因。这里也支持删除单个导入批次，或一键清空全部导入数据。
        </Paragraph>
      </div>

      <Alert
        type="info"
        showIcon
        message="使用顺序"
        description="1. 上传搜索词报表。2. 上传投放商品报表。3. 去规则页确认规则。4. 回分析页运行分析。如果替换了源数据，建议先删除旧批次或直接清空后重传。"
      />

      <Card style={{ borderRadius: 18 }}>
        <Form form={form} layout="vertical">
          <Form.Item name="shop_id" label="关联店铺（可选）">
            <Select
              allowClear
              placeholder="留空时按全局数据导入"
              options={(shops.data ?? []).map((shop) => ({
                value: shop.id,
                label: `${shop.name} / ${shop.marketplace}`,
              }))}
            />
          </Form.Item>

          <Space wrap>
            <Upload beforeUpload={beforeUpload("search")} showUploadList={false}>
              <Button type="primary" loading={searchUpload.isPending}>
                上传搜索词报表
              </Button>
            </Upload>
            <Upload beforeUpload={beforeUpload("product")} showUploadList={false}>
              <Button loading={productUpload.isPending}>上传投放商品报表</Button>
            </Upload>
            <Popconfirm
              title="确认清空全部导入数据？"
              description="会删除所有导入批次、源报表数据以及分析派生结果。"
              onConfirm={() => clearBatches.mutate()}
            >
              <Button danger loading={clearBatches.isPending}>
                清空全部
              </Button>
            </Popconfirm>
          </Space>
        </Form>
      </Card>

      <Card title="导入批次" style={{ borderRadius: 18 }}>
        <Table
          rowKey="id"
          dataSource={batches.data ?? []}
          columns={[
            { title: "批次 ID", dataIndex: "id" },
            { title: "类型", dataIndex: "report_type", render: (value: string) => batchTypeLabels[value] ?? value },
            { title: "文件名", dataIndex: "filename" },
            { title: "状态", dataIndex: "status", render: (value: string) => batchStatusLabels[value] ?? value },
            { title: "行数", dataIndex: "row_count" },
            { title: "开始日期", dataIndex: "date_range_start" },
            { title: "结束日期", dataIndex: "date_range_end" },
            {
              title: "操作",
              render: (_, record: { id: number }) => (
                <Popconfirm
                  title="确认删除这个批次？"
                  description="会同步清掉当前已有的分析派生数据，删除后需要重新运行分析。"
                  onConfirm={() => deleteBatch.mutate(record.id)}
                >
                  <Button danger size="small" loading={deleteBatch.isPending}>
                    删除
                  </Button>
                </Popconfirm>
              ),
            },
          ]}
        />
      </Card>
    </Space>
  );
}
