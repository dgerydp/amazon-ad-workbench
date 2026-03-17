import { DownloadOutlined, FileExcelOutlined, FolderOpenOutlined, LineChartOutlined } from "@ant-design/icons";
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
    <Space direction="vertical" size={24} style={{ display: "flex" }} className="page-layout">
      <section className="page-hero">
        <div className="page-hero-main">
          <div className="page-kicker">Export Desk</div>
          <Title className="page-title">把分析结果导成真正能发出去、能执行、能复盘的文件</Title>
          <Paragraph className="page-summary">
            导出页不应该只是几个下载按钮。这里把不同输出场景拆开，让你能快速拿到高表现词、否词建议和 sellerSKU 汇总，也保留完整工作簿一次性打包。
          </Paragraph>
          <div className="page-chip-row">
            <div className="page-chip">CSV 按场景导出</div>
            <div className="page-chip">完整 Excel 工作簿</div>
            <div className="page-chip">适合复盘、协作和运营执行</div>
          </div>
        </div>

        <aside className="page-hero-side">
          <div className="page-side-kicker">Export Pulse</div>
          <div className="page-side-value">{exportsConfig.length}</div>
          <div className="page-side-copy">已提供的专项导出类型</div>
          <div className="page-side-grid">
            <div className="page-side-metric">
              <span>CSV 导出</span>
              <strong>{exportsConfig.length}</strong>
            </div>
            <div className="page-side-metric">
              <span>完整工作簿</span>
              <strong>1</strong>
            </div>
            <div className="page-side-metric">
              <span>输出格式</span>
              <strong>2</strong>
            </div>
            <div className="page-side-metric">
              <span>目标</span>
              <strong>Ops</strong>
            </div>
          </div>
        </aside>
      </section>

      <Alert
        type="info"
        showIcon
        message="导出前提"
        description="如果当前没有内容可导出，通常是因为还没上传报表或还没运行分析，不是导出页本身的问题。"
      />

      <Row gutter={[16, 16]}>
        {exportsConfig.map((item, index) => (
          <Col xs={24} md={12} xl={8} key={item.key}>
            <Card className="export-card page-section-card">
              <Space direction="vertical" size={16} style={{ display: "flex" }}>
                <Tag color={index === 0 ? "green" : index === 1 ? "volcano" : "blue"}>{item.key}</Tag>
                <div className="page-action-icon">{index === 0 ? <LineChartOutlined /> : index === 1 ? <DownloadOutlined /> : <FolderOpenOutlined />}</div>
                <Title level={4} style={{ margin: 0 }}>
                  {item.title}
                </Title>
                <Paragraph style={{ marginBottom: 0 }}>{item.description}</Paragraph>
                <Button type="primary" href={api.exportUrl(item.key)} target="_blank" icon={<DownloadOutlined />}>
                  下载 CSV
                </Button>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Card title="完整工作簿" className="page-section-card">
        <div className="page-action-grid">
          <div className="page-action-card">
            <div className="page-action-icon">
              <FileExcelOutlined />
            </div>
            <div className="page-action-title">完整导出</div>
            <div className="page-action-copy">如果你想一次性导出全部分析结果，直接下载完整 Excel 工作簿即可。</div>
            <Button type="primary" href={api.excelExportUrl()} target="_blank" icon={<DownloadOutlined />}>
              下载完整 Excel
            </Button>
          </div>
        </div>
      </Card>
    </Space>
  );
}
