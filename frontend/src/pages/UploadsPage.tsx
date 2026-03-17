import {
  ClearOutlined,
  DatabaseOutlined,
  FolderOpenOutlined,
  ShopOutlined,
  UploadOutlined,
} from "@ant-design/icons";
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

  const batchRows = batches.data ?? [];
  const processingCount = batchRows.filter((item) => item.status === "processing").length;
  const totalRows = batchRows.reduce((sum, item) => sum + Number(item.row_count ?? 0), 0);

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
    <Space direction="vertical" size={24} style={{ display: "flex" }} className="page-layout">
      <section className="page-hero">
        <div className="page-hero-main">
          <div className="page-kicker">Report Intake</div>
          <Title className="page-title">先把报表入口整理干净，后面的分析链路才会稳</Title>
          <Paragraph className="page-summary">
            上传页负责把搜索词报表和投放商品报表接入系统。这里不做花哨的东西，重点是让导入动作、店铺归属和批次状态一眼可控。
          </Paragraph>
          <div className="page-chip-row">
            <div className="page-chip">搜索词 + 投放商品双报表</div>
            <div className="page-chip">支持关联店铺</div>
            <div className="page-chip">可删除单批次或整体重置</div>
          </div>
        </div>

        <aside className="page-hero-side">
          <div className="page-side-kicker">Ingestion Pulse</div>
          <div className="page-side-value">{batchRows.length}</div>
          <div className="page-side-copy">当前导入批次数</div>
          <div className="page-side-grid">
            <div className="page-side-metric">
              <span>处理中</span>
              <strong>{processingCount}</strong>
            </div>
            <div className="page-side-metric">
              <span>累计行数</span>
              <strong>{totalRows}</strong>
            </div>
            <div className="page-side-metric">
              <span>可选店铺</span>
              <strong>{shops.data?.length ?? 0}</strong>
            </div>
            <div className="page-side-metric">
              <span>导入类型</span>
              <strong>2</strong>
            </div>
          </div>
        </aside>
      </section>

      <Alert
        type="info"
        showIcon
        message="使用顺序"
        description="1. 上传搜索词报表。2. 上传投放商品报表。3. 去规则页确认规则。4. 回分析页运行分析。如果替换了源数据，建议先删除旧批次或直接清空后重传。"
      />

      <div className="page-dual-grid">
        <Card title="导入设置" className="page-section-card">
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

            <div className="page-action-grid">
              <div className="page-action-card">
                <div className="page-action-icon">
                  <FolderOpenOutlined />
                </div>
                <div className="page-action-title">搜索词报表</div>
                <div className="page-action-copy">导入搜索词、点击、订单和销售额等搜索词视角数据。</div>
                <Upload beforeUpload={beforeUpload("search")} showUploadList={false}>
                  <Button type="primary" icon={<UploadOutlined />} loading={searchUpload.isPending}>
                    上传搜索词报表
                  </Button>
                </Upload>
              </div>

              <div className="page-action-card">
                <div className="page-action-icon">
                  <DatabaseOutlined />
                </div>
                <div className="page-action-title">投放商品报表</div>
                <div className="page-action-copy">补全商品维度数据，用于后续 sellerSKU 归因和聚合统计。</div>
                <Upload beforeUpload={beforeUpload("product")} showUploadList={false}>
                  <Button icon={<UploadOutlined />} loading={productUpload.isPending}>
                    上传投放商品报表
                  </Button>
                </Upload>
              </div>

              <div className="page-action-card">
                <div className="page-action-icon">
                  <ClearOutlined />
                </div>
                <div className="page-action-title">重置导入区</div>
                <div className="page-action-copy">当你确认要全量替换源数据时，一次性清空所有批次和派生结果。</div>
                <Popconfirm
                  title="确认清空全部导入数据？"
                  description="会删除所有导入批次、源报表数据以及分析派生结果。"
                  onConfirm={() => clearBatches.mutate()}
                >
                  <Button danger loading={clearBatches.isPending}>
                    清空全部
                  </Button>
                </Popconfirm>
              </div>
            </div>
          </Form>
        </Card>

        <Card title="导入区状态" className="page-section-card">
          <div className="page-stat-grid">
            <div className="page-stat-tile">
              <div className="page-stat-label">Connected Shops</div>
              <div className="page-stat-value">{shops.data?.length ?? 0}</div>
              <div className="page-stat-help">可作为导入归属的店铺数量。</div>
            </div>
            <div className="page-stat-tile">
              <div className="page-stat-label">Latest Batch</div>
              <div className="page-stat-value">{batchRows[0]?.id ?? "-"}</div>
              <div className="page-stat-help">最近一个导入批次的编号。</div>
            </div>
            <div className="page-stat-tile">
              <div className="page-stat-label">Completed</div>
              <div className="page-stat-value">{batchRows.filter((item) => item.status === "completed").length}</div>
              <div className="page-stat-help">已完成导入的批次数。</div>
            </div>
            <div className="page-stat-tile">
              <div className="page-stat-label">Source Scope</div>
              <div className="page-stat-value">
                <ShopOutlined />
              </div>
              <div className="page-stat-help">可按店铺隔离导入，也支持全局导入。</div>
            </div>
          </div>
        </Card>
      </div>

      <Card title="导入批次" className="page-table-card">
        <Table
          rowKey="id"
          dataSource={batchRows}
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
