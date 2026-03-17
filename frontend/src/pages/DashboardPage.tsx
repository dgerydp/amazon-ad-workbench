import {
  CloudUploadOutlined,
  ControlOutlined,
  DatabaseOutlined,
  PlayCircleOutlined,
  RadarChartOutlined,
  TagsOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
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

  const overviewData = overview.data;
  const skuRows = (skuInsights.data ?? []) as Array<Record<string, unknown>>;
  const ruleRows = (ruleHits.data ?? []) as Array<Record<string, unknown>>;
  const tagRows = (tags.data ?? []) as Array<Record<string, unknown>>;

  const workflowSteps = [
    {
      title: "上传报表",
      description: "先导入搜索词报表和投放商品报表，把原始数据链路接好。",
      icon: <CloudUploadOutlined />,
      action: () => navigate("/uploads"),
    },
    {
      title: "配置规则",
      description: "维护表现标签和组合决策，让系统按你的运营逻辑打标。",
      icon: <ControlOutlined />,
      action: () => navigate("/rules"),
    },
    {
      title: "运行分析",
      description: "执行 sellerSKU 关联、拆词和标签分析，得到可直接查看的结果。",
      icon: <PlayCircleOutlined />,
      action: () => navigate("/analysis"),
    },
  ];

  return (
    <Space direction="vertical" size={24} style={{ display: "flex" }} className="dashboard-page">
      <section className="dashboard-hero">
        <div className="dashboard-hero-main">
          <div className="dashboard-kicker">Mission Control</div>
          <Title className="dashboard-title">
            用 sellerSKU 把广告信号串成一条可执行链路
          </Title>
          <Paragraph className="dashboard-summary">
            这里不是单纯堆表格，而是把搜索词、投放商品、规则标签和语义标签压到一个工作台里，方便你快速判断哪些词该放大，哪些词该否定，哪些 SKU 正在拖累投放效率。
          </Paragraph>
          <Space wrap className="dashboard-actions">
            <Button type="primary" size="large" icon={<CloudUploadOutlined />} onClick={() => navigate("/uploads")}>
              上传报表
            </Button>
            <Button size="large" icon={<ControlOutlined />} onClick={() => navigate("/rules")}>
              配置规则
            </Button>
            <Button size="large" icon={<PlayCircleOutlined />} onClick={() => navigate("/analysis")}>
              运行分析
            </Button>
          </Space>

          <div className="dashboard-flow">
            {workflowSteps.map((step, index) => (
              <button key={step.title} type="button" className="dashboard-flow-card" onClick={step.action}>
                <div className="dashboard-flow-index">{String(index + 1).padStart(2, "0")}</div>
                <div className="dashboard-flow-icon">{step.icon}</div>
                <div className="dashboard-flow-title">{step.title}</div>
                <div className="dashboard-flow-description">{step.description}</div>
              </button>
            ))}
          </div>
        </div>

        <aside className="dashboard-hero-side">
          <div className="dashboard-pulse-card">
            <div className="dashboard-pulse-label">Signal Pulse</div>
            <div className="dashboard-pulse-value">{overviewData?.rule_hits ?? 0}</div>
            <div className="dashboard-pulse-caption">当前规则命中数</div>
            <div className="dashboard-pulse-grid">
              <div className="dashboard-pulse-metric">
                <span>搜索词行数</span>
                <strong>{overviewData?.search_term_reports ?? 0}</strong>
              </div>
              <div className="dashboard-pulse-metric">
                <span>投放商品行数</span>
                <strong>{overviewData?.advertised_products ?? 0}</strong>
              </div>
              <div className="dashboard-pulse-metric">
                <span>sellerSKU 数</span>
                <strong>{skuRows.length}</strong>
              </div>
              <div className="dashboard-pulse-metric">
                <span>标签簇</span>
                <strong>{tagRows.length}</strong>
              </div>
            </div>
          </div>
        </aside>
      </section>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={6}>
          <StatCard
            title="搜索词行数"
            value={overviewData?.search_term_reports ?? 0}
            icon={<RadarChartOutlined />}
            accent="blue"
            hint="搜索词视角的原始数据规模"
          />
        </Col>
        <Col xs={24} md={12} xl={6}>
          <StatCard
            title="投放商品行数"
            value={overviewData?.advertised_products ?? 0}
            icon={<DatabaseOutlined />}
            accent="cyan"
            hint="用于 sellerSKU 归因的商品明细"
          />
        </Col>
        <Col xs={24} md={12} xl={6}>
          <StatCard
            title="拆词数量"
            value={overviewData?.tokens ?? 0}
            icon={<ThunderboltOutlined />}
            accent="emerald"
            hint="完成拆词后的词元总量"
          />
        </Col>
        <Col xs={24} md={12} xl={6}>
          <StatCard
            title="规则命中"
            value={overviewData?.rule_hits ?? 0}
            icon={<TagsOutlined />}
            accent="amber"
            hint="命中的表现标签和组合决策"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card title="sellerSKU 汇总" className="dashboard-table-card">
            <Table
              rowKey={(record) => String(record.seller_sku ?? record.id ?? record.search_term ?? "seller-sku")}
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
        <Col xs={24} xl={10}>
          <Card title="最新规则命中" className="dashboard-table-card">
            <Table
              rowKey={(record) =>
                String(record.id ?? `${String(record.group_name ?? "group")}-${String(record.label_name ?? "label")}-${String(record.token ?? "token")}`)
              }
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

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={9}>
          <Card title="推荐工作流" className="dashboard-guide-card">
            <div className="dashboard-guide-list">
              {workflowSteps.map((step, index) => (
                <div key={step.title} className="dashboard-guide-item">
                  <div className="dashboard-guide-badge">{index + 1}</div>
                  <div>
                    <div className="dashboard-guide-title">{step.title}</div>
                    <div className="dashboard-guide-description">{step.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={15}>
          <Card title="语义标签分布" className="dashboard-tags-card">
            {tagRows.length ? (
              <div className="dashboard-tag-cloud">
                {tagRows.map((item) => (
                  <Tag key={String(item.tag_l1)} color="blue" className="dashboard-tag-pill">
                    {String(item.tag_l1)} / {String(item.count ?? 0)}
                  </Tag>
                ))}
              </div>
            ) : (
              <Empty description="还没有标签数据，请先上传报表并运行分析。" />
            )}
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
