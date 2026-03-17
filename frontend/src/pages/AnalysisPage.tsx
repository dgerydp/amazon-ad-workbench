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
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
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

  const mainColumns = useMemo(() => {
    if (mode === "search_term") {
      return [
        { title: "搜索词", dataIndex: "search_term" },
        {
          title: "sellerSKU",
          dataIndex: "seller_skus",
          render: (value: string[]) =>
            value?.length ? <Space wrap>{value.map((item) => <Tag key={item}>{item}</Tag>)}</Space> : <Text type="secondary">未关联</Text>,
        },
        {
          title: "拆分词",
          dataIndex: "split_terms",
          render: (value: string[]) =>
            value?.length ? <Space wrap>{value.map((item) => <Tag key={item}>{item}</Tag>)}</Space> : <Text type="secondary">未拆词</Text>,
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

  return (
    <Space direction="vertical" size={24} style={{ display: "flex" }}>
      <div>
        <Title level={2}>分析</Title>
        <Paragraph>
          这里尽量按你参考项目的用法收敛成两种主视图：看搜索词本身，或者看拆词结果。规则配置单独放在规则页维护。
        </Paragraph>
      </div>

      <Alert
        type="info"
        showIcon
        message="推荐顺序"
        description="先上传两类报表，再去规则页确认打标签逻辑，然后回来运行分析。参考项目里搜索词和拆词是两套观察视角，这里也沿用这个思路。"
        action={
          <Button size="small" onClick={() => navigate("/rules")}>
            去规则页
          </Button>
        }
      />

      <Card title="运行参数" style={{ borderRadius: 18 }}>
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

          <Alert
            type={enabledConfigs.length ? "success" : "warning"}
            showIcon
            message={enabledConfigs.length ? "已检测到 AI 配置" : "未检测到 AI 配置"}
            description={
              enabledConfigs.length
                ? `将使用已启用配置：${enabledConfigs
                    .map((item) => `${item.provider}${item.model ? ` / ${item.model}` : ""}`)
                    .join("；")}`
                : "如需开启 AI，请先到 AI 配置页保存一条启用中的配置。"
            }
            style={{ marginBottom: 24 }}
          />

          <Button type="primary" htmlType="submit" loading={mutation.isPending}>
            运行分析
          </Button>
        </Form>
      </Card>

      <Card title="分析任务" style={{ borderRadius: 18 }}>
        <Table
          rowKey="id"
          dataSource={jobs.data ?? []}
          columns={[
            { title: "任务 ID", dataIndex: "id" },
            {
              title: "状态",
              dataIndex: "status",
              render: (value: string) => (
                <Tag color={value === "completed" ? "green" : value === "failed" ? "red" : "blue"}>{jobStatusLabels[value] ?? value}</Tag>
              ),
            },
            { title: "范围", dataIndex: "scope", render: (value: string) => scopeLabels[value] ?? value },
            { title: "结果摘要", dataIndex: "result", render: summarizeJobResult },
          ]}
        />
      </Card>

      <Card title="分析结果" style={{ borderRadius: 18 }}>
        <Space direction="vertical" size={16} style={{ display: "flex" }}>
          <Segmented
            options={[
              { label: "搜索词", value: "search_term" },
              { label: "拆词", value: "token" },
            ]}
            value={mode}
            onChange={(value) => setMode(value as AnalysisMode)}
          />

          <Table rowKey="id" dataSource={mainRows} columns={mainColumns} pagination={{ pageSize: 8 }} scroll={{ x: 1200 }} />
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="sellerSKU 汇总" style={{ borderRadius: 18 }}>
            <Table
              rowKey={(record) => String(record.seller_sku)}
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
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="最新规则命中" style={{ borderRadius: 18 }}>
            <Table
              rowKey="id"
              dataSource={ruleRows}
              pagination={{ pageSize: 8 }}
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
    </Space>
  );
}
