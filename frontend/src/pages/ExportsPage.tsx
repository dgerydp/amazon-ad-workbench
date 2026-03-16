import { Button, Card, List, Space, Typography } from "antd";

import { api } from "../services/api";

const { Title, Paragraph } = Typography;

type ExportItem = {
  key: "high-performance" | "negative-keywords" | "seller-sku-summary";
  title: string;
  description: string;
};

const exportsConfig: ExportItem[] = [
  { key: "high-performance", title: "High Performance Terms", description: "Export tokens whose action_label is promote." },
  { key: "negative-keywords", title: "Negative Keyword Suggestions", description: "Export tokens whose action_label is negative_exact." },
  { key: "seller-sku-summary", title: "sellerSKU Summary", description: "Export aggregated sellerSKU metrics for clicks, spend, orders, and sales." },
];

export function ExportsPage() {
  return (
    <Space direction="vertical" size={24} style={{ display: "flex" }}>
      <div>
        <Title level={2}>Exports</Title>
        <Paragraph>Download generated CSV files or the full Excel workbook for review, sharing, or manual follow-up.</Paragraph>
      </div>
      <Card style={{ borderRadius: 16 }}>
        <List
          dataSource={exportsConfig}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button key={item.key} type="primary" href={api.exportUrl(item.key)} target="_blank">
                  Download
                </Button>,
              ]}
            >
              <List.Item.Meta title={item.title} description={item.description} />
            </List.Item>
          )}
        />
      </Card>
      <Card style={{ borderRadius: 16 }}>
        <Button type="primary" href={api.excelExportUrl()} target="_blank">
          Download Full Excel Workbook
        </Button>
      </Card>
    </Space>
  );
}
