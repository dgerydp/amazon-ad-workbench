import { useQuery } from "@tanstack/react-query";
import { Button, Card, Col, Empty, Row, Space, Table, Tag, Typography } from "antd";
import { useNavigate } from "react-router-dom";

import { StatCard } from "../components/StatCard";
import { api } from "../services/api";

const { Paragraph, Title } = Typography;

export function DashboardPage() {
  const navigate = useNavigate();
  const overview = useQuery({ queryKey: ["overview"], queryFn: api.getOverview });
  const ruleHits = useQuery({ queryKey: ["rule-hits"], queryFn: api.getRuleHits });
  const skuInsights = useQuery({ queryKey: ["seller-sku-insights"], queryFn: api.getSellerSkuInsights });
  const tags = useQuery({ queryKey: ["tag-summary"], queryFn: api.getTagSummary });

  const skuRows = (skuInsights.data ?? []) as Array<Record<string, unknown>>;
  const ruleRows = (ruleHits.data ?? []) as Array<Record<string, unknown>>;
  const tagRows = (tags.data ?? []) as Array<Record<string, unknown>>;

  return (
    <Space direction="vertical" size={24} style={{ display: "flex" }}>
      <div>
        <Title level={2}>概览</Title>
        <Paragraph>
          这是围绕 sellerSKU 的亚马逊广告分析工作台。主流程很简单：上传报表，配置规则，运行分析，然后看标签和导出结果。
        </Paragraph>
        <Space wrap>
          <Button type="primary" size="large" onClick={() => navigate("/uploads")}>
            上传报表
          </Button>
          <Button size="large" onClick={() => navigate("/rules")}>
            配置规则
          </Button>
          <Button size="large" onClick={() => navigate("/analysis")}>
            运行分析
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <StatCard title="搜索词行数" value={overview.data?.search_term_reports ?? 0} />
        </Col>
        <Col xs={24} md={6}>
          <StatCard title="投放商品行数" value={overview.data?.advertised_products ?? 0} />
        </Col>
        <Col xs={24} md={6}>
          <StatCard title="拆词数量" value={overview.data?.tokens ?? 0} />
        </Col>
        <Col xs={24} md={6}>
          <StatCard title="规则命中" value={overview.data?.rule_hits ?? 0} />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="sellerSKU 汇总" style={{ borderRadius: 18 }}>
            <Table
              rowKey={(record) => String(record.seller_sku ?? Math.random())}
              size="small"
              pagination={{ pageSize: 8 }}
              dataSource={skuRows}
              locale={{ emptyText: <Empty description="暂无 sellerSKU 汇总" /> }}
              columns={[
                { title: "sellerSKU", dataIndex: "seller_sku" },
                { title: "词元数", dataIndex: "token_count" },
                { title: "搜索词数", dataIndex: "search_term_count" },
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
              rowKey={(record) => String(record.id ?? Math.random())}
              size="small"
              pagination={{ pageSize: 8 }}
              dataSource={ruleRows}
              locale={{ emptyText: <Empty description="暂无规则命中" /> }}
              columns={[
                { title: "类型", dataIndex: "hit_type", render: (value: string) => (value === "decision" ? "组合决策" : "规则标签") },
                { title: "规则组", dataIndex: "group_name" },
                { title: "标签", dataIndex: "label_name" },
                { title: "词元", dataIndex: "token" },
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Card title="语义标签分布" style={{ borderRadius: 18 }}>
        <Space wrap size={[12, 12]}>
          {tagRows.length ? (
            tagRows.map((item) => (
              <Tag key={String(item.tag_l1)} color="blue" style={{ padding: "6px 10px", fontSize: 14 }}>
                {String(item.tag_l1)}: {String(item.count ?? 0)}
              </Tag>
            ))
          ) : (
            <Paragraph style={{ marginBottom: 0 }}>还没有标签数据，请先上传报表并运行分析。</Paragraph>
          )}
        </Space>
      </Card>
    </Space>
  );
}
