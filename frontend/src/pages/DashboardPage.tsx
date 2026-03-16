import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Col, Row, Space, Table, Tag, Typography, message } from "antd";
import { useNavigate } from "react-router-dom";

import { StatCard } from "../components/StatCard";
import { api } from "../services/api";

const { Title, Paragraph } = Typography;

export function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const overview = useQuery({ queryKey: ["overview"], queryFn: api.getOverview });
  const ruleHits = useQuery({ queryKey: ["rule-hits"], queryFn: api.getRuleHits });
  const skuInsights = useQuery({ queryKey: ["seller-sku-insights"], queryFn: api.getSellerSkuInsights });
  const tags = useQuery({ queryKey: ["tag-summary"], queryFn: api.getTagSummary });

  const skuRows = (skuInsights.data ?? []) as Array<Record<string, string | number | null>>;
  const ruleRows = (ruleHits.data ?? []) as Array<Record<string, string | number | null>>;
  const tagRows = (tags.data ?? []) as Array<Record<string, string | number | null>>;

  const demoBootstrap = useMutation({
    mutationFn: () => api.bootstrapDemo({ reset: false, use_ai: false }),
    onSuccess: (data) => {
      message.success(`Demo data loaded: ${data.shop_name}`);
      [
        "overview",
        "rule-hits",
        "seller-sku-insights",
        "tag-summary",
        "tokens",
        "search-terms",
        "shops",
        "seller-skus",
        "batches",
        "analysis-jobs",
      ].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
    },
  });

  return (
    <Space direction="vertical" size={24} style={{ display: "flex" }}>
      <div>
        <Title level={2}>Overview</Title>
        <Paragraph>
          This repository is an open-source Amazon ad analysis workbench centered on sellerSKU. You can bootstrap demo data
          to explore the full flow, or upload your own Search Term Report and Advertised Product Report.
        </Paragraph>
        <Space wrap>
          <Button type="primary" size="large" onClick={() => demoBootstrap.mutate()} loading={demoBootstrap.isPending}>
            Load Demo Data
          </Button>
          <Button size="large" onClick={() => navigate("/uploads")}>
            Upload Reports
          </Button>
          <Button size="large" onClick={() => navigate("/analysis")}>
            Run Analysis
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <StatCard title="Search Term Rows" value={overview.data?.search_term_reports ?? 0} />
        </Col>
        <Col xs={24} md={6}>
          <StatCard title="Advertised Product Rows" value={overview.data?.advertised_products ?? 0} />
        </Col>
        <Col xs={24} md={6}>
          <StatCard title="Tokens" value={overview.data?.tokens ?? 0} />
        </Col>
        <Col xs={24} md={6}>
          <StatCard title="Rule Hits" value={overview.data?.rule_hits ?? 0} />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="sellerSKU Summary" style={{ borderRadius: 16 }}>
            <Table
              rowKey={(record) => String(record.seller_sku ?? record.token_count ?? Math.random())}
              size="small"
              pagination={{ pageSize: 8 }}
              dataSource={skuRows}
              columns={[
                { title: "sellerSKU", dataIndex: "seller_sku" },
                { title: "Token Count", dataIndex: "token_count" },
                { title: "Clicks", dataIndex: "clicks" },
                { title: "Orders", dataIndex: "orders" },
                { title: "Spend", dataIndex: "spend" },
                { title: "Sales", dataIndex: "sales" },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Rule Hits" style={{ borderRadius: 16 }}>
            <Table
              rowKey={(record) => String(record.id ?? Math.random())}
              size="small"
              pagination={{ pageSize: 8 }}
              dataSource={ruleRows}
              columns={[
                { title: "Rule", dataIndex: "rule_name" },
                { title: "Action", dataIndex: "action_type" },
                { title: "Target ID", dataIndex: "target_id" },
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Tag Distribution" style={{ borderRadius: 16 }}>
        <Space wrap size={[12, 12]}>
          {tagRows.length ? (
            tagRows.map((item) => (
              <Tag key={String(item.tag_l1)} color="blue" style={{ padding: "6px 10px", fontSize: 14 }}>
                {String(item.tag_l1)}: {String(item.count ?? 0)}
              </Tag>
            ))
          ) : (
            <Paragraph style={{ marginBottom: 0 }}>No tags yet. Upload reports and run analysis first.</Paragraph>
          )}
        </Space>
      </Card>
    </Space>
  );
}
