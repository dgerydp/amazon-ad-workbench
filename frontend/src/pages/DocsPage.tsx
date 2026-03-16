import { Card, Col, Row, Space, Typography } from "antd";

import { useLocale } from "../i18n/LocaleProvider";

const { Title, Paragraph, Text } = Typography;

export function DocsPage() {
  const { t } = useLocale();

  return (
    <Space direction="vertical" size={24} style={{ display: "flex" }}>
      <div>
        <Title level={2}>{t("docs.title")}</Title>
        <Paragraph>{t("docs.desc")}</Paragraph>
      </div>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title={t("docs.readingOrder")} style={{ borderRadius: 16 }}>
            <Space direction="vertical">
              <Text>1. docs/prd/project-overview.md</Text>
              <Text>2. docs/architecture/system-design.md</Text>
              <Text>3. docs/architecture/data-model-outline.md</Text>
              <Text>4. docs/api/api-outline.md</Text>
              <Text>5. docs/onboarding/quick-start.md</Text>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title={t("docs.snapshot")} style={{ borderRadius: 16 }}>
            <Space direction="vertical">
              <Text>{t("docs.snapshot.demo")}</Text>
              <Text>{t("docs.snapshot.reports")}</Text>
              <Text>{t("docs.snapshot.tags")}</Text>
              <Text>{t("docs.snapshot.providers")}</Text>
              <Text>{t("docs.snapshot.lingxing")}</Text>
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
