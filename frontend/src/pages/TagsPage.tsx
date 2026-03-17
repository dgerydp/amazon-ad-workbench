import { useQuery } from "@tanstack/react-query";
import { Alert, Card, Col, Empty, Row, Space, Table, Tag, Typography } from "antd";

import { api } from "../services/api";

const { Paragraph, Title } = Typography;

export function TagsPage() {
  const summary = useQuery({ queryKey: ["tag-summary"], queryFn: api.getTagSummary });
  const tokens = useQuery({ queryKey: ["tokens"], queryFn: api.getTokens });
  const tokenRows = (tokens.data ?? []) as Array<Record<string, unknown>>;
  const summaryRows = (summary.data ?? []) as Array<Record<string, unknown>>;

  return (
    <Space direction="vertical" size={24} style={{ display: "flex" }}>
      <div>
        <Title level={2}>标签</Title>
        <Paragraph>
          这里用于检查语义标签和规则标签是否符合预期。没有真实分析结果时页面会保持为空，不再展示任何示例数据。
        </Paragraph>
      </div>

      <Alert
        type="info"
        showIcon
        message="怎么看这个页面"
        description="先看一级语义标签分布，再往下抽查词元明细。这里能同时看到搜索词来源、语义标签、规则标签和最终组合决策。"
      />

      {summaryRows.length ? (
        <Row gutter={[16, 16]}>
          {summaryRows.map((item) => (
            <Col xs={24} md={8} lg={6} key={String(item.tag_l1)}>
              <Card className="tag-summary-card" style={{ borderRadius: 18 }}>
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
        <Card style={{ borderRadius: 18 }}>
          <Empty description="还没有标签结果。请先上传报表并运行分析。" />
        </Card>
      )}

      <Card title="词元标签明细" style={{ borderRadius: 18 }}>
        <Table
          rowKey={(record) => String(record.id)}
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
