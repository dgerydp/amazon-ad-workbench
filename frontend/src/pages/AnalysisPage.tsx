import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Form, Input, Select, Space, Switch, Table, Tag, Typography, message } from "antd";

import { api } from "../services/api";

const { Title, Paragraph } = Typography;

export function AnalysisPage() {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const shops = useQuery({ queryKey: ["shops"], queryFn: api.listShops });
  const jobs = useQuery({ queryKey: ["analysis-jobs"], queryFn: api.listAnalysisJobs });
  const tokens = useQuery({ queryKey: ["tokens"], queryFn: api.getTokens });
  const searchTerms = useQuery({ queryKey: ["search-terms"], queryFn: api.getSearchTerms });
  const tokenRows = (tokens.data ?? []) as Array<Record<string, string | number | null>>;

  const mutation = useMutation({
    mutationFn: api.runAnalysis,
    onSuccess: () => {
      message.success("Analysis finished");
      queryClient.invalidateQueries({ queryKey: ["analysis-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["tokens"] });
      queryClient.invalidateQueries({ queryKey: ["search-terms"] });
      queryClient.invalidateQueries({ queryKey: ["overview"] });
      queryClient.invalidateQueries({ queryKey: ["rule-hits"] });
      queryClient.invalidateQueries({ queryKey: ["seller-sku-insights"] });
      queryClient.invalidateQueries({ queryKey: ["tag-summary"] });
    },
  });

  return (
    <Space direction="vertical" size={24} style={{ display: "flex" }}>
      <div>
        <Title level={2}>Analysis</Title>
        <Paragraph>
          Run sellerSKU attribution, tokenization, semantic tagging, and built-in rules. If AI is disabled or unavailable, the
          system falls back to heuristic tagging automatically.
        </Paragraph>
      </div>
      <Card style={{ borderRadius: 16 }}>
        <Form form={form} layout="vertical" onFinish={(values) => mutation.mutate(values)}>
          <Form.Item name="shop_id" label="Shop">
            <Select allowClear options={(shops.data ?? []).map((shop) => ({ value: shop.id, label: `${shop.name} / ${shop.marketplace}` }))} />
          </Form.Item>
          <Form.Item name="use_ai" label="Enable AI Tagging" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="provider" label="AI Provider">
            <Input placeholder="Optional: openai / qwen / doubao" />
          </Form.Item>
          <Form.Item name="model" label="Model">
            <Input placeholder="Optional: use saved provider default if empty" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={mutation.isPending}>
            Run Analysis
          </Button>
        </Form>
      </Card>

      <Card title="Analysis Jobs" style={{ borderRadius: 16 }}>
        <Table
          rowKey="id"
          dataSource={jobs.data ?? []}
          columns={[
            { title: "ID", dataIndex: "id" },
            { title: "Status", dataIndex: "status" },
            { title: "Scope", dataIndex: "scope" },
            {
              title: "Result",
              dataIndex: "result",
              render: (value) => (value ? JSON.stringify(value) : "-"),
            },
          ]}
        />
      </Card>

      <Card title="Search Terms" style={{ borderRadius: 16 }}>
        <Table
          rowKey="id"
          pagination={{ pageSize: 8 }}
          dataSource={searchTerms.data ?? []}
          columns={[
            { title: "Search Term", dataIndex: "search_term" },
            { title: "Campaign", dataIndex: "campaign_name" },
            { title: "Ad Group", dataIndex: "ad_group_name" },
            { title: "Clicks", dataIndex: "clicks" },
            { title: "Orders", dataIndex: "orders" },
            { title: "Spend", dataIndex: "spend" },
            { title: "Sales", dataIndex: "sales" },
          ]}
        />
      </Card>

      <Card title="Tokens" style={{ borderRadius: 16 }}>
        <Table
          rowKey="id"
          pagination={{ pageSize: 8 }}
          dataSource={tokenRows}
          columns={[
            { title: "Token", dataIndex: "token" },
            { title: "sellerSKU", dataIndex: "seller_sku" },
            {
              title: "Tag",
              dataIndex: "tag_l1",
              render: (value, record: Record<string, string | number | null>) =>
                value ? (
                  <Space wrap>
                    <Tag color="blue">{String(value)}</Tag>
                    {record.tag_l2 ? <Tag>{String(record.tag_l2)}</Tag> : null}
                    {record.provider ? <Tag color="green">{String(record.provider)}</Tag> : null}
                  </Space>
                ) : (
                  "-"
                ),
            },
            { title: "Clicks", dataIndex: "clicks" },
            { title: "Orders", dataIndex: "orders" },
            { title: "Spend", dataIndex: "spend" },
            { title: "Action", dataIndex: "action_label" },
          ]}
        />
      </Card>
    </Space>
  );
}
