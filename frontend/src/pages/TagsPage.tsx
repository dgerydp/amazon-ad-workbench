import { useQuery } from "@tanstack/react-query";
import { Card, Col, Row, Space, Table, Tag, Typography } from "antd";

import { useLocale } from "../i18n/LocaleProvider";
import { api } from "../services/api";

const { Title, Paragraph } = Typography;

export function TagsPage() {
  const { t } = useLocale();
  const summary = useQuery({ queryKey: ["tag-summary"], queryFn: api.getTagSummary });
  const tokens = useQuery({ queryKey: ["tokens"], queryFn: api.getTokens });
  const tokenRows = (tokens.data ?? []) as Array<Record<string, string | number | null>>;

  return (
    <Space direction="vertical" size={24} style={{ display: "flex" }}>
      <div>
        <Title level={2}>{t("tags.title")}</Title>
        <Paragraph>{t("tags.desc")}</Paragraph>
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

      <Card title={t("tags.details")} style={{ borderRadius: 16 }}>
        <Table
          rowKey={(record) => String(record.id)}
          pagination={{ pageSize: 10 }}
          dataSource={tokenRows}
          columns={[
            { title: t("common.token"), dataIndex: "token" },
            { title: "sellerSKU", dataIndex: "seller_sku" },
            { title: t("tags.l1"), dataIndex: "tag_l1" },
            { title: t("tags.l2"), dataIndex: "tag_l2" },
            { title: t("tags.l3"), dataIndex: "tag_l3" },
            { title: t("common.reason"), dataIndex: "reason" },
            { title: t("common.provider"), dataIndex: "provider" },
            { title: t("common.action"), dataIndex: "action_label" },
          ]}
        />
      </Card>
    </Space>
  );
}
