import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Col, Row, Space, Table, Tag, Typography, message } from "antd";
import { useNavigate } from "react-router-dom";

import { StatCard } from "../components/StatCard";
import { useLocale } from "../i18n/LocaleProvider";
import { api } from "../services/api";

const { Title, Paragraph } = Typography;

export function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLocale();
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
      message.success(t("message.demoLoaded", { name: data.shop_name }));
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
        <Title level={2}>{t("dashboard.title")}</Title>
        <Paragraph>{t("dashboard.desc")}</Paragraph>
        <Space wrap>
          <Button type="primary" size="large" onClick={() => demoBootstrap.mutate()} loading={demoBootstrap.isPending}>
            {t("dashboard.loadDemo")}
          </Button>
          <Button size="large" onClick={() => navigate("/uploads")}>
            {t("dashboard.uploadReports")}
          </Button>
          <Button size="large" onClick={() => navigate("/analysis")}>
            {t("dashboard.runAnalysis")}
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <StatCard title={t("dashboard.searchRows")} value={overview.data?.search_term_reports ?? 0} />
        </Col>
        <Col xs={24} md={6}>
          <StatCard title={t("dashboard.productRows")} value={overview.data?.advertised_products ?? 0} />
        </Col>
        <Col xs={24} md={6}>
          <StatCard title={t("dashboard.tokens")} value={overview.data?.tokens ?? 0} />
        </Col>
        <Col xs={24} md={6}>
          <StatCard title={t("dashboard.ruleHits")} value={overview.data?.rule_hits ?? 0} />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={t("dashboard.skuSummary")} style={{ borderRadius: 16 }}>
            <Table
              rowKey={(record) => String(record.seller_sku ?? record.token_count ?? Math.random())}
              size="small"
              pagination={{ pageSize: 8 }}
              dataSource={skuRows}
              columns={[
                { title: "sellerSKU", dataIndex: "seller_sku" },
                { title: t("dashboard.tokenCount"), dataIndex: "token_count" },
                { title: t("common.clicks"), dataIndex: "clicks" },
                { title: t("common.orders"), dataIndex: "orders" },
                { title: t("common.spend"), dataIndex: "spend" },
                { title: t("common.sales"), dataIndex: "sales" },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={t("dashboard.ruleHits")} style={{ borderRadius: 16 }}>
            <Table
              rowKey={(record) => String(record.id ?? Math.random())}
              size="small"
              pagination={{ pageSize: 8 }}
              dataSource={ruleRows}
              columns={[
                { title: t("dashboard.rule"), dataIndex: "rule_name" },
                { title: t("common.action"), dataIndex: "action_type" },
                { title: t("dashboard.targetId"), dataIndex: "target_id" },
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Card title={t("dashboard.tagDistribution")} style={{ borderRadius: 16 }}>
        <Space wrap size={[12, 12]}>
          {tagRows.length ? (
            tagRows.map((item) => (
              <Tag key={String(item.tag_l1)} color="blue" style={{ padding: "6px 10px", fontSize: 14 }}>
                {String(item.tag_l1)}: {String(item.count ?? 0)}
              </Tag>
            ))
          ) : (
            <Paragraph style={{ marginBottom: 0 }}>{t("dashboard.noTags")}</Paragraph>
          )}
        </Space>
      </Card>
    </Space>
  );
}
