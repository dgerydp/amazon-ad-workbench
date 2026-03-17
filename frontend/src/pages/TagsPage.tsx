import { EyeOutlined, TagsOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Alert, Card, Col, Empty, Row, Space, Table, Tag, Typography } from "antd";

import { api } from "../services/api";

const { Paragraph, Title } = Typography;

export function TagsPage() {
  const summary = useQuery({ queryKey: ["tag-summary"], queryFn: api.getTagSummary });
  const tokens = useQuery({ queryKey: ["tokens"], queryFn: api.getTokens });
  const tokenRows = (tokens.data ?? []) as Array<Record<string, unknown>>;
  const summaryRows = (summary.data ?? []) as Array<Record<string, unknown>>;
  const labeledRows = tokenRows.filter((item) => item.tag_l1 || (Array.isArray(item.matched_labels) && item.matched_labels.length));

  return (
    <Space direction="vertical" size={24} style={{ display: "flex" }} className="page-layout">
      <section className="page-hero">
        <div className="page-hero-main">
          <div className="page-kicker">Label Review</div>
          <Title className="page-title">标签页不是摆设，它是你校验模型和规则是否靠谱的观察窗</Title>
          <Paragraph className="page-summary">
            这里专门用来看语义标签、规则标签和组合决策有没有打到对的位置。它更像质检台，不是运营动作页。
          </Paragraph>
          <div className="page-chip-row">
            <div className="page-chip">语义标签分布</div>
            <div className="page-chip">词元级明细</div>
            <div className="page-chip">组合决策回看</div>
          </div>
        </div>

        <aside className="page-hero-side">
          <div className="page-side-kicker">Tag Pulse</div>
          <div className="page-side-value">{summaryRows.length}</div>
          <div className="page-side-copy">当前一级标签簇数量</div>
          <div className="page-side-grid">
            <div className="page-side-metric">
              <span>词元总数</span>
              <strong>{tokenRows.length}</strong>
            </div>
            <div className="page-side-metric">
              <span>已打标词元</span>
              <strong>{labeledRows.length}</strong>
            </div>
            <div className="page-side-metric">
              <span>标签来源</span>
              <strong>2</strong>
            </div>
            <div className="page-side-metric">
              <span>检查目标</span>
              <strong>QA</strong>
            </div>
          </div>
        </aside>
      </section>

      <Alert
        type="info"
        showIcon
        message="怎么看这个页面"
        description="先看一级语义标签分布，再往下抽查词元明细。这里能同时看到搜索词来源、语义标签、规则标签和最终组合决策。"
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card className="page-section-card">
            <div className="page-stat-label">Semantic Clusters</div>
            <div className="page-stat-value">
              <TagsOutlined /> {summaryRows.length}
            </div>
            <div className="page-stat-help">一级语义标签的聚合数量。</div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="page-section-card">
            <div className="page-stat-label">Token Coverage</div>
            <div className="page-stat-value">
              <ThunderboltOutlined /> {tokenRows.length}
            </div>
            <div className="page-stat-help">进入标签检查的词元规模。</div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="page-section-card">
            <div className="page-stat-label">Inspection Rows</div>
            <div className="page-stat-value">
              <EyeOutlined /> {labeledRows.length}
            </div>
            <div className="page-stat-help">至少带有一种标签或决策的词元条目。</div>
          </Card>
        </Col>
      </Row>

      {summaryRows.length ? (
        <Row gutter={[16, 16]}>
          {summaryRows.map((item) => (
            <Col xs={24} md={8} lg={6} key={String(item.tag_l1)}>
              <Card className="tag-summary-card page-section-card">
                <Space direction="vertical" size={12}>
                  <Tag color="blue">{String(item.tag_l1 ?? "未打标")}</Tag>
                  <Title level={3} style={{ margin: 0 }}>
                    {String(item.count ?? 0)}
                  </Title>
                  <Paragraph style={{ marginBottom: 0, color: "#66756a" }}>该一级标签下的词元数量</Paragraph>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Card className="page-section-card">
          <Empty description="还没有标签结果。请先上传报表并运行分析。" />
        </Card>
      )}

      <Card title="词元标签明细" className="page-table-card">
        <Table
          rowKey={(record) => String(record.id ?? `${String(record.token)}-${String(record.search_term)}`)}
          pagination={{ pageSize: 10 }}
          dataSource={tokenRows}
          locale={{ emptyText: <Empty description="当前没有词元标签数据" /> }}
          columns={[
            { title: "来源搜索词", dataIndex: "search_term" },
            { title: "词元", dataIndex: "token" },
            { title: "sellerSKU", dataIndex: "seller_sku" },
            {
              title: "语义标签",
              render: (_, record) =>
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
              title: "规则标签",
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
            { title: "规则建议", dataIndex: "decision_advice" },
            { title: "语义来源", dataIndex: "provider" },
          ]}
        />
      </Card>
    </Space>
  );
}
