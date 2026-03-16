import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Form, Select, Space, Switch, Table, Tag, Typography, message } from "antd";

import { useLocale } from "../i18n/LocaleProvider";
import { api } from "../services/api";

const { Title, Paragraph } = Typography;

export function AnalysisPage() {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const { t } = useLocale();
  const shops = useQuery({ queryKey: ["shops"], queryFn: api.listShops });
  const providers = useQuery({ queryKey: ["providers"], queryFn: api.listProviders });
  const jobs = useQuery({ queryKey: ["analysis-jobs"], queryFn: api.listAnalysisJobs });
  const tokens = useQuery({ queryKey: ["tokens"], queryFn: api.getTokens });
  const searchTerms = useQuery({ queryKey: ["search-terms"], queryFn: api.getSearchTerms });
  const selectedProvider = Form.useWatch("provider", form);
  const tokenRows = (tokens.data ?? []) as Array<Record<string, string | number | null>>;
  const providerOptions = (providers.data?.defaults ?? []).map((item) => ({
    value: item.provider,
    label: item.label,
  }));
  const models = useQuery({
    queryKey: ["provider-models", selectedProvider],
    queryFn: () => api.listProviderModels(selectedProvider),
    enabled: Boolean(selectedProvider),
  });

  const mutation = useMutation({
    mutationFn: api.runAnalysis,
    onSuccess: () => {
      message.success(t("message.analysisFinished"));
      queryClient.invalidateQueries({ queryKey: ["analysis-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["tokens"] });
      queryClient.invalidateQueries({ queryKey: ["search-terms"] });
      queryClient.invalidateQueries({ queryKey: ["overview"] });
      queryClient.invalidateQueries({ queryKey: ["rule-hits"] });
      queryClient.invalidateQueries({ queryKey: ["seller-sku-insights"] });
      queryClient.invalidateQueries({ queryKey: ["tag-summary"] });
    },
  });

  return (
    <Space direction="vertical" size={24} style={{ display: "flex" }}>
      <div>
        <Title level={2}>{t("analysis.title")}</Title>
        <Paragraph>{t("analysis.desc")}</Paragraph>
      </div>
      <Card style={{ borderRadius: 16 }}>
        <Form form={form} layout="vertical" onFinish={(values) => mutation.mutate(values)}>
          <Form.Item name="shop_id" label={t("common.shop")}>
            <Select allowClear options={(shops.data ?? []).map((shop) => ({ value: shop.id, label: `${shop.name} / ${shop.marketplace}` }))} />
          </Form.Item>
          <Form.Item name="use_ai" label={t("analysis.enableAi")} valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="provider" label={t("common.provider")}>
            <Select
              allowClear
              showSearch
              options={providerOptions}
              placeholder={t("common.selectProviderFirst")}
              onChange={() => form.setFieldValue("model", undefined)}
            />
          </Form.Item>
          <Form.Item name="model" label={t("common.model")}>
            <Select
              allowClear
              showSearch
              disabled={!selectedProvider}
              loading={models.isFetching}
              options={(models.data?.models ?? []).map((model) => ({ value: model, label: model }))}
              placeholder={selectedProvider ? t("common.selectModel") : t("common.selectProviderFirst")}
              dropdownRender={(menu) => (
                <>
                  {menu}
                  {selectedProvider ? (
                    <div style={{ padding: 8 }}>
                      <Button block size="small" onClick={() => void models.refetch()} loading={models.isFetching}>
                        {t("common.refreshModels")}
                      </Button>
                    </div>
                  ) : null}
                </>
              )}
            />
          </Form.Item>
          {selectedProvider && models.data?.message ? <Paragraph type="secondary">{models.data.message}</Paragraph> : null}
          <Button type="primary" htmlType="submit" loading={mutation.isPending}>
            {t("analysis.run")}
          </Button>
        </Form>
      </Card>

      <Card title={t("analysis.jobs")} style={{ borderRadius: 16 }}>
        <Table
          rowKey="id"
          dataSource={jobs.data ?? []}
          columns={[
            { title: t("common.id"), dataIndex: "id" },
            { title: t("common.status"), dataIndex: "status" },
            { title: t("common.scope"), dataIndex: "scope" },
            {
              title: t("common.result"),
              dataIndex: "result",
              render: (value) => (value ? JSON.stringify(value) : "-"),
            },
          ]}
        />
      </Card>

      <Card title={t("analysis.searchTerms")} style={{ borderRadius: 16 }}>
        <Table
          rowKey="id"
          pagination={{ pageSize: 8 }}
          dataSource={searchTerms.data ?? []}
          columns={[
            { title: t("common.searchTerm"), dataIndex: "search_term" },
            { title: t("common.campaign"), dataIndex: "campaign_name" },
            { title: t("common.adGroup"), dataIndex: "ad_group_name" },
            { title: t("common.clicks"), dataIndex: "clicks" },
            { title: t("common.orders"), dataIndex: "orders" },
            { title: t("common.spend"), dataIndex: "spend" },
            { title: t("common.sales"), dataIndex: "sales" },
          ]}
        />
      </Card>

      <Card title={t("analysis.tokens")} style={{ borderRadius: 16 }}>
        <Table
          rowKey="id"
          pagination={{ pageSize: 8 }}
          dataSource={tokenRows}
          columns={[
            { title: t("common.token"), dataIndex: "token" },
            { title: "sellerSKU", dataIndex: "seller_sku" },
            {
              title: t("analysis.tag"),
              dataIndex: "tag_l1",
              render: (value, record: Record<string, string | number | null>) =>
                value ? (
                  <Space wrap>
                    <Tag color="blue">{String(value)}</Tag>
                    {record.tag_l2 ? <Tag>{String(record.tag_l2)}</Tag> : null}
                    {record.provider ? <Tag color="green">{String(record.provider)}</Tag> : null}
                  </Space>
                ) : (
                  "-"
                ),
            },
            { title: t("common.clicks"), dataIndex: "clicks" },
            { title: t("common.orders"), dataIndex: "orders" },
            { title: t("common.spend"), dataIndex: "spend" },
            { title: t("common.action"), dataIndex: "action_label" },
          ]}
        />
      </Card>
    </Space>
  );
}
