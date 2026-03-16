import { useQuery } from "@tanstack/react-query";
import { Card, Col, Row, Space, Table, Tag, Typography } from "antd";

import { api } from "../services/api";

const { Title, Paragraph } = Typography;

export function TagsPage() {
  const summary = useQuery({ queryKey: ["tag-summary"], queryFn: api.getTagSummary });
  const tokens = useQuery({ queryKey: ["tokens"], queryFn: api.getTokens });
  const tokenRows = (tokens.data ?? []) as Array<Record<string, string | number | null>>;

  return (
    <Space direction="vertical" size={24} style={{ display: "flex" }}>
      <div>
        <Title level={2}>Tags</Title>
        <Paragraph>Review semantic tag distribution and inspect token-level labeling output. This is the best place to validate model quality and rule outcomes.</Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        {(summary.data ?? []).map((item: Record<string, string | number | null>) => (
          <Col xs={24} md={8} lg={6} key={String(item.tag_l1)}>
            <Card style={{ borderRadius: 16 }}>
              <Space direction="vertical">
                <Tag color="blue">{String(item.tag_l1 ?? "untagged")}</Tag>
                <Title level={3} style={{ margin: 0 }}>
                  {String(item.count ?? 0)}
                </Title>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Card title="Token Tag Details" style={{ borderRadius: 16 }}>
        <Table
          rowKey={(record) => String(record.id)}
          pagination={{ pageSize: 10 }}
          dataSource={tokenRows}
          columns={[
            { title: "Token", dataIndex: "token" },
            { title: "sellerSKU", dataIndex: "seller_sku" },
            { title: "L1", dataIndex: "tag_l1" },
            { title: "L2", dataIndex: "tag_l2" },
            { title: "L3", dataIndex: "tag_l3" },
            { title: "Reason", dataIndex: "reason" },
            { title: "Provider", dataIndex: "provider" },
            { title: "Action", dataIndex: "action_label" },
          ]}
        />
      </Card>
    </Space>
  );
}
