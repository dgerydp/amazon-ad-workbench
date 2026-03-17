import { Alert, Button, Card, Col, Row, Space, Tag, Typography } from "antd";

import { api } from "../services/api";

const { Paragraph, Title } = Typography;

type ExportItem = {
  key: "high-performance" | "negative-keywords" | "seller-sku-summary";
  title: string;
  description: string;
};

const exportsConfig: ExportItem[] = [
  {
    key: "high-performance",
    title: "高表现词导出",
    description: "导出适合继续放量或重点培养的词元，便于后续人工复盘和广告扩量。",
  },
  {
    key: "negative-keywords",
    title: "否词建议",
    description: "导出需要重点控本或进入否词复核的词元，适合运营人工确认后执行。",
  },
  {
    key: "seller-sku-summary",
    title: "sellerSKU 汇总",
    description: "按 sellerSKU 聚合导出点击、花费、订单和销售额，方便看商品层表现。",
  },
];

export function ExportsPage() {
  return (
    <Space direction="vertical" size={24} style={{ display: "flex" }}>
      <div>
        <Title level={2}>导出</Title>
        <Paragraph>分析完成后，可以在这里导出 CSV 或完整 Excel 工作簿，用于复盘、共享和后续运营处理。</Paragraph>
      </div>

      <Alert
        type="info"
        showIcon
        message="导出前提"
        description="如果当前没有内容可导出，通常是因为还没上传报表或还没运行分析，不是导出页本身的问题。"
      />

      <Row gutter={[16, 16]}>
        {exportsConfig.map((item) => (
          <Col xs={24} md={12} xl={8} key={item.key}>
            <Card className="export-card" style={{ borderRadius: 20 }}>
              <Space direction="vertical" size={16} style={{ display: "flex" }}>
                <Tag color="green">{item.key}</Tag>
                <Title level={4} style={{ margin: 0 }}>
                  {item.title}
                </Title>
                <Paragraph style={{ marginBottom: 0 }}>{item.description}</Paragraph>
                <Button type="primary" href={api.exportUrl(item.key)} target="_blank">
                  下载 CSV
                </Button>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Card title="完整工作簿" style={{ borderRadius: 18 }}>
        <Paragraph>如果你想一次性导出全部分析结果，直接下载完整 Excel 工作簿即可。</Paragraph>
        <Button type="primary" href={api.excelExportUrl()} target="_blank">
          下载完整 Excel
        </Button>
      </Card>
    </Space>
  );
}
