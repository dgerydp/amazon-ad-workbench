import { Button, Card, List, Space, Typography } from "antd";

import { useLocale } from "../i18n/LocaleProvider";
import { api } from "../services/api";

const { Title, Paragraph } = Typography;

type ExportItem = {
  key: "high-performance" | "negative-keywords" | "seller-sku-summary";
  title: string;
  description: string;
};

export function ExportsPage() {
  const { t } = useLocale();
  const exportsConfig: ExportItem[] = [
    { key: "high-performance", title: t("exports.highTerms"), description: t("exports.highTermsDesc") },
    { key: "negative-keywords", title: t("exports.negativeTerms"), description: t("exports.negativeTermsDesc") },
    { key: "seller-sku-summary", title: t("exports.skuSummary"), description: t("exports.skuSummaryDesc") },
  ];

  return (
    <Space direction="vertical" size={24} style={{ display: "flex" }}>
      <div>
        <Title level={2}>{t("exports.title")}</Title>
        <Paragraph>{t("exports.desc")}</Paragraph>
      </div>
      <Card style={{ borderRadius: 16 }}>
        <List
          dataSource={exportsConfig}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button key={item.key} type="primary" href={api.exportUrl(item.key)} target="_blank">
                  {t("common.download")}
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
          {t("exports.fullExcel")}
        </Button>
      </Card>
    </Space>
  );
}
