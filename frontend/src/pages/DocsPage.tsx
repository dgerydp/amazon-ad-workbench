import { Card, Col, Row, Space, Typography } from "antd";

const { Title, Paragraph, Text } = Typography;

export function DocsPage() {
  return (
    <Space direction="vertical" size={24} style={{ display: "flex" }}>
      <div>
        <Title level={2}>Docs</Title>
        <Paragraph>Use this page as a quick guide to the repository documentation. The actual markdown files live in the root docs folder.</Paragraph>
      </div>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Recommended Reading Order" style={{ borderRadius: 16 }}>
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
          <Card title="Current Capability Snapshot" style={{ borderRadius: 16 }}>
            <Space direction="vertical">
              <Text>Demo data bootstrap is available</Text>
              <Text>Two report types are supported</Text>
              <Text>sellerSKU attribution and token tagging are implemented</Text>
              <Text>OpenAI, Claude, Gemini, DeepSeek, Qwen, and Doubao are supported</Text>
              <Text>Lingxing connection test and basic sync are included</Text>
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
