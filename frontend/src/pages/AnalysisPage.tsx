import { ControlOutlined, PlayCircleOutlined } from "@ant-design/icons";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Row,
  Segmented,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from "antd";

import { api } from "../services/api";

const { Paragraph, Text, Title } = Typography;

type AnalysisMode = "search_term" | "token";

const jobStatusLabels: Record<string, string> = {
  completed: "已完成",
  failed: "失败",
  running: "运行中",
};

const scopeLabels: Record<string, string> = {
  all: "全量数据",
  shop: "单店铺",
};

function summarizeJobResult(value: unknown) {
  if (!value || typeof value !== "object") {
    return "-";
  }

  const result = value as {
    linking?: { linked_rows?: number; expanded_reports?: number; unlinked?: number; linked?: number; ambiguous?: number };
    tokenization?: { tokens_created?: number };
    tagging?: { tagged?: number };
    rules?: { label_hits?: number; decision_hits?: number };
  };

  const parts: string[] = [];
  if (result.linking) {
    parts.push(`已关联 ${result.linking.linked_rows ?? result.linking.linked ?? 0}`);
    parts.push(`多 SKU 展开 ${result.linking.expanded_reports ?? result.linking.ambiguous ?? 0}`);
    parts.push(`未关联 ${result.linking.unlinked ?? 0}`);
  }
  if (result.tokenization) {
    parts.push(`拆词 ${result.tokenization.tokens_created ?? 0}`);
  }
  if (result.tagging) {
    parts.push(`语义标签 ${result.tagging.tagged ?? 0}`);
  }
  if (result.rules) {
    parts.push(`表现标签 ${result.rules.label_hits ?? 0}`);
    parts.push(`组合决策 ${result.rules.decision_hits ?? 0}`);
  }
  return parts.join(" / ") || "-";
}

export function AnalysisPage() {
  const [form] = Form.useForm();
  const [mode, setMode] = useState<AnalysisMode>("search_term");
  const queryClient = useQueryClient();

  const shops = useQuery({ queryKey: ["shops"], queryFn: api.listShops });
  const providers = useQuery({ queryKey: ["providers"], queryFn: api.listProviders });
  const jobs = useQuery({ queryKey: ["analysis-jobs"], queryFn: api.listAnalysisJobs });
  const tokens = useQuery({ queryKey: ["tokens"], queryFn: api.getTokens });
  const searchTerms = useQuery({ queryKey: ["search-terms"], queryFn: api.getSearchTerms });
  const sellerSkuSummary = useQuery({ queryKey: ["seller-sku-insights"], queryFn: api.getSellerSkuInsights });
  const ruleHits = useQuery({ queryKey: ["rule-hits"], queryFn: api.getRuleHits });

  const configRows = (providers.data?.configs ?? []) as Array<Record<string, string | number | boolean | null>>;
  const enabledConfigs = configRows.filter((item) => item.enabled);

  const mutation = useMutation({
    mutationFn: api.runAnalysis,
    onSuccess: async () => {
      message.success("分析已完成");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["analysis-jobs"] }),
        queryClient.invalidateQueries({ queryKey: ["tokens"] }),
        queryClient.invalidateQueries({ queryKey: ["search-terms"] }),
        queryClient.invalidateQueries({ queryKey: ["overview"] }),
        queryClient.invalidateQueries({ queryKey: ["rule-hits"] }),
        queryClient.invalidateQueries({ queryKey: ["seller-sku-insights"] }),
        queryClient.invalidateQueries({ queryKey: ["tag-summary"] }),
      ]);
    },
  });

  const handleSubmit = (values: { shop_id?: number; use_ai?: boolean }) => {
    if (values.use_ai && !enabledConfigs.length) {
      message.error("请先到 AI 配置页保存一条启用配置，再回来开启 AI。");
      return;
    }
    mutation.mutate({
      shop_id: values.shop_id,
      use_ai: Boolean(values.use_ai),
    });
  };

  const tokenRows = (tokens.data ?? []) as Array<Record<string, unknown>>;
  const searchTermRows = (searchTerms.data ?? []) as Array<Record<string, unknown>>;
  const sellerSkuRows = (sellerSkuSummary.data ?? []) as Array<Record<string, unknown>>;
  const ruleRows = (ruleHits.data ?? []) as Array<Record<string, unknown>>;
  const jobRows = (jobs.data ?? []) as Array<Record<string, unknown>>;
  const activeConfig = enabledConfigs[0];
  const activeConfigLabel = activeConfig
    ? `${String(activeConfig.provider)}${activeConfig.model ? ` / ${String(activeConfig.model)}` : ""}`
    : null;

  const mainColumns = useMemo(() => {
    if (mode === "search_term") {
      return [
        { title: "搜索词", dataIndex: "search_term" },
        {
          title: "sellerSKU",
          dataIndex: "seller_skus",
          render: (value: string[]) =>
            value?.length ? (
              <Space wrap>{value.map((item) => <Tag key={item}>{item}</Tag>)}</Space>
            ) : (
              <Text type="secondary">未关联</Text>
            ),
        },
        {
          title: "拆分词",
          dataIndex: "split_terms",
          render: (value: string[]) =>
            value?.length ? (
              <Space wrap>{value.map((item) => <Tag key={item}>{item}</Tag>)}</Space>
            ) : (
              <Text type="secondary">未拆词</Text>
            ),
        },
        {
          title: "动作建议",
          dataIndex: "action_labels",
          render: (value: string[]) =>
            value?.length ? <Space wrap>{value.map((item) => <Tag color="green" key={item}>{item}</Tag>)}</Space> : "-",
        },
        { title: "点击", dataIndex: "clicks" },
        { title: "订单", dataIndex: "orders" },
        { title: "花费", dataIndex: "spend" },
        { title: "销售额", dataIndex: "sales" },
      ];
    }

    return [
      { title: "词", dataIndex: "token" },
      { title: "来源搜索词", dataIndex: "search_term" },
      { title: "sellerSKU", dataIndex: "seller_sku" },
      {
        title: "语义标签",
        render: (_: unknown, record: Record<string, unknown>) =>
          record.tag_l1 ? (
            <Space wrap>
              <Tag color="blue">{String(record.tag_l1)}</Tag>
              {record.tag_l2 ? <Tag>{String(record.tag_l2)}</Tag> : null}
              {record.tag_l3 ? <Tag>{String(record.tag_l3)}</Tag> : null}
            </Space>
          ) : (
            "-"
          ),
      },
      {
        title: "表现标签",
        dataIndex: "matched_labels",
        render: (value: Array<{ group_name: string; label_name: string; color?: string }>) =>
          value?.length ? (
            <Space wrap>
              {value.map((item) => (
                <Tag color={item.color || "default"} key={`${item.group_name}-${item.label_name}`}>
                  {item.group_name}: {item.label_name}
                </Tag>
              ))}
            </Space>
          ) : (
            "-"
          ),
      },
      { title: "组合决策", dataIndex: "decision_name" },
      { title: "点击", dataIndex: "clicks" },
      { title: "订单", dataIndex: "orders" },
      { title: "花费", dataIndex: "spend" },
      { title: "销售额", dataIndex: "sales" },
    ];
  }, [mode]);

  const mainRows = mode === "search_term" ? searchTermRows : tokenRows;
  const latestJobStatus = jobRows[0]?.status ? jobStatusLabels[String(jobRows[0].status)] ?? String(jobRows[0].status) : "-";

  return (
    <Space direction="vertical" size={20} style={{ display: "flex" }} className="page-layout">
      <section className="analysis-header">
        <div>
          <Title className="analysis-header-title">分析</Title>
          <Paragraph className="analysis-header-copy">
            运行 sellerSKU 关联、拆词、规则打标，以及可选的 AI 语义打标。
          </Paragraph>
        </div>
        <div className="analysis-header-metrics">
          <div className="analysis-header-metric">
            <span>任务</span>
            <strong>{jobRows.length}</strong>
          </div>
          <div className="analysis-header-metric">
            <span>搜索词</span>
            <strong>{searchTermRows.length}</strong>
          </div>
          <div className="analysis-header-metric">
            <span>词元</span>
            <strong>{tokenRows.length}</strong>
          </div>
        </div>
      </section>

      <Alert
        type={activeConfig ? "success" : "warning"}
        showIcon
        message={activeConfig ? "AI 配置将自动复用已启用项" : "当前没有启用中的 AI 配置"}
        description={
          activeConfig
            ? `开启 AI 后将直接使用：${activeConfigLabel}。这里不需要重复选择 Provider 或模型。`
            : "如果要启用 AI 语义打标，请先到 AI 配置页保存并启用一条配置。"
        }
      />

      <div className="page-dual-grid">
        <Card title="运行参数" className="page-section-card">
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item name="shop_id" label="店铺（可选）">
              <Select
                allowClear
                placeholder="留空表示跑全量数据"
                options={(shops.data ?? []).map((shop) => ({
                  value: shop.id,
                  label: `${shop.name} / ${shop.marketplace}`,
                }))}
              />
            </Form.Item>

            <Form.Item name="use_ai" label="启用 AI 语义打标（可选）" valuePropName="checked">
              <Switch />
            </Form.Item>

            <Text className="page-inline-note">
              {enabledConfigs.length
                ? `已检测到启用配置：${enabledConfigs
                    .map((item) => `${item.provider}${item.model ? ` / ${item.model}` : ""}`)
                    .join("；")}`
                : "未检测到启用中的 AI 配置。"}
            </Text>

            <div style={{ marginTop: 20 }}>
              <Button type="primary" htmlType="submit" icon={<PlayCircleOutlined />} loading={mutation.isPending}>
                运行分析
              </Button>
            </div>
          </Form>
        </Card>

        <Card title="当前概况" className="page-section-card">
          <div className="page-stat-grid">
            <div className="page-stat-tile">
              <div className="page-stat-label">sellerSKU</div>
              <div className="page-stat-value">{sellerSkuRows.length}</div>
              <div className="page-stat-help">已形成汇总视图的 SKU 数量。</div>
            </div>
            <div className="page-stat-tile">
              <div className="page-stat-label">最新状态</div>
              <div className="page-stat-value">{latestJobStatus}</div>
              <div className="page-stat-help">最近一次分析任务状态。</div>
            </div>
            <div className="page-stat-tile">
              <div className="page-stat-label">规则命中</div>
              <div className="page-stat-value">{ruleRows.length}</div>
              <div className="page-stat-help">规则标签和组合决策命中条数。</div>
            </div>
            <div className="page-stat-tile">
              <div className="page-stat-label">AI</div>
              <div className="page-stat-value">{enabledConfigs.length ? "ON" : "OFF"}</div>
              <div className="page-stat-help">只会复用已启用的配置。</div>
            </div>
          </div>
        </Card>
      </div>

      <Card title="分析结果" className="page-table-card">
        <Space direction="vertical" size={16} style={{ display: "flex" }}>
          <Segmented
            options={[
              { label: "搜索词", value: "search_term" },
              { label: "拆词", value: "token" },
            ]}
            value={mode}
            onChange={(value) => setMode(value as AnalysisMode)}
          />
          <Table
            rowKey={(record) => String(record.id ?? record.search_term ?? record.token)}
            dataSource={mainRows}
            columns={mainColumns}
            pagination={{ pageSize: 8 }}
            scroll={{ x: 1200 }}
          />
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card title="分析任务" className="page-table-card">
            <Table
              rowKey="id"
              dataSource={jobRows}
              columns={[
                { title: "任务 ID", dataIndex: "id" },
                {
                  title: "状态",
                  dataIndex: "status",
                  render: (value: string) => (
                    <Tag color={value === "completed" ? "green" : value === "failed" ? "red" : "blue"}>
                      {jobStatusLabels[value] ?? value}
                    </Tag>
                  ),
                },
                { title: "范围", dataIndex: "scope", render: (value: string) => scopeLabels[value] ?? value },
                { title: "结果摘要", dataIndex: "result", render: summarizeJobResult },
              ]}
              pagination={{ pageSize: 6 }}
            />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title="最新规则命中" className="page-table-card">
            <Table
              rowKey={(record) => String(record.id ?? `${String(record.token)}-${String(record.search_term)}`)}
              dataSource={ruleRows}
              pagination={{ pageSize: 6 }}
              columns={[
                { title: "类型", dataIndex: "hit_type", render: (value: string) => (value === "decision" ? "组合决策" : "表现标签") },
                { title: "规则组", dataIndex: "group_name" },
                { title: "标签", dataIndex: "label_name" },
                { title: "词", dataIndex: "token" },
                { title: "搜索词", dataIndex: "search_term" },
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Card title="sellerSKU 汇总" className="page-table-card">
        <Table
          rowKey={(record) => String(record.seller_sku ?? record.id)}
          dataSource={sellerSkuRows}
          pagination={{ pageSize: 8 }}
          columns={[
            { title: "sellerSKU", dataIndex: "seller_sku" },
            { title: "搜索词数", dataIndex: "search_term_count" },
            { title: "拆词数", dataIndex: "token_count" },
            { title: "点击", dataIndex: "clicks" },
            { title: "订单", dataIndex: "orders" },
            { title: "花费", dataIndex: "spend" },
            { title: "销售额", dataIndex: "sales" },
            {
              title: "规则",
              render: () => (
                <Tag icon={<ControlOutlined />} bordered={false}>
                  已接入
                </Tag>
              ),
            },
          ]}
        />
      </Card>
    </Space>
  );
}
