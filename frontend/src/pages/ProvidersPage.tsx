import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Form, Input, Select, Space, Table, Typography, message } from "antd";

import { useLocale } from "../i18n/LocaleProvider";
import { api } from "../services/api";

const { Title, Paragraph } = Typography;

export function ProvidersPage() {
  const [saveForm] = Form.useForm();
  const [testForm] = Form.useForm();
  const queryClient = useQueryClient();
  const { t } = useLocale();
  const providers = useQuery({ queryKey: ["providers"], queryFn: api.listProviders });
  const selectedSaveProvider = Form.useWatch("provider", saveForm);
  const selectedTestProvider = Form.useWatch("provider", testForm);
  const defaultRows = (providers.data?.defaults ?? []) as Array<Record<string, string>>;
  const configRows = (providers.data?.configs ?? []) as Array<Record<string, string | number | boolean | null>>;
  const providerOptions = defaultRows.map((item) => ({ value: item.provider, label: item.label }));
  const saveModels = useQuery({
    queryKey: ["provider-models", "save", selectedSaveProvider],
    queryFn: () => api.listProviderModels(selectedSaveProvider),
    enabled: Boolean(selectedSaveProvider),
  });
  const testModels = useQuery({
    queryKey: ["provider-models", "test", selectedTestProvider],
    queryFn: () => api.listProviderModels(selectedTestProvider),
    enabled: Boolean(selectedTestProvider),
  });

  const saveMutation = useMutation({
    mutationFn: api.saveProviderConfig,
    onSuccess: () => {
      message.success(t("message.providerSaved"));
      queryClient.invalidateQueries({ queryKey: ["providers"] });
    },
  });

  const testMutation = useMutation({
    mutationFn: api.testProvider,
    onSuccess: (data) => {
      message.info(data.message);
    },
  });

  return (
    <Space direction="vertical" size={24} style={{ display: "flex" }}>
      <div>
        <Title level={2}>{t("providers.title")}</Title>
        <Paragraph>{t("providers.desc")}</Paragraph>
      </div>

      <Card title={t("common.saveConfig")} style={{ borderRadius: 16 }}>
        <Form form={saveForm} layout="vertical" onFinish={(values) => saveMutation.mutate(values)}>
          <Form.Item name="provider" label={t("common.provider")} rules={[{ required: true }]}>
            <Select
              options={providerOptions}
              onChange={(value) => {
                const current = configRows.find((item) => item.provider === value);
                saveForm.setFieldValue("base_url", current?.base_url ?? undefined);
                saveForm.setFieldValue("model", current?.model ?? undefined);
              }}
            />
          </Form.Item>
          <Form.Item name="base_url" label={t("common.baseUrl")}>
            <Input placeholder={t("providers.baseUrlPlaceholder")} />
          </Form.Item>
          <Form.Item name="model" label={t("common.model")}>
            <Select
              allowClear
              showSearch
              disabled={!selectedSaveProvider}
              loading={saveModels.isFetching}
              options={(saveModels.data?.models ?? []).map((model) => ({ value: model, label: model }))}
              placeholder={selectedSaveProvider ? t("common.selectModel") : t("common.selectProviderFirst")}
              dropdownRender={(menu) => (
                <>
                  {menu}
                  {selectedSaveProvider ? (
                    <div style={{ padding: 8 }}>
                      <Button block size="small" onClick={() => void saveModels.refetch()} loading={saveModels.isFetching}>
                        {t("common.refreshModels")}
                      </Button>
                    </div>
                  ) : null}
                </>
              )}
            />
          </Form.Item>
          <Form.Item name="api_key" label={t("common.apiKey")}>
            <Input.Password />
          </Form.Item>
          {selectedSaveProvider && saveModels.data?.message ? <Paragraph type="secondary">{saveModels.data.message}</Paragraph> : null}
          <Button type="primary" htmlType="submit" loading={saveMutation.isPending}>
            {t("common.save")}
          </Button>
        </Form>
      </Card>

      <Card title={t("common.testConnection")} style={{ borderRadius: 16 }}>
        <Form form={testForm} layout="vertical" onFinish={(values) => testMutation.mutate(values)}>
          <Form.Item name="provider" label={t("common.provider")} rules={[{ required: true }]}>
            <Select options={providerOptions} />
          </Form.Item>
          <Form.Item name="base_url" label={t("common.baseUrl")}>
            <Input placeholder={t("providers.baseUrlPlaceholder")} />
          </Form.Item>
          <Form.Item name="model" label={t("common.model")}>
            <Select
              allowClear
              showSearch
              disabled={!selectedTestProvider}
              loading={testModels.isFetching}
              options={(testModels.data?.models ?? []).map((model) => ({ value: model, label: model }))}
              placeholder={selectedTestProvider ? t("common.selectModel") : t("common.selectProviderFirst")}
              dropdownRender={(menu) => (
                <>
                  {menu}
                  {selectedTestProvider ? (
                    <div style={{ padding: 8 }}>
                      <Button block size="small" onClick={() => void testModels.refetch()} loading={testModels.isFetching}>
                        {t("common.refreshModels")}
                      </Button>
                    </div>
                  ) : null}
                </>
              )}
            />
          </Form.Item>
          <Form.Item name="api_key" label={t("common.apiKey")}>
            <Input.Password />
          </Form.Item>
          {selectedTestProvider && testModels.data?.message ? <Paragraph type="secondary">{testModels.data.message}</Paragraph> : null}
          <Button htmlType="submit" loading={testMutation.isPending}>
            {t("common.test")}
          </Button>
        </Form>
      </Card>

      <Card title={t("common.builtInProviderList")} style={{ borderRadius: 16 }}>
        <Table
          rowKey={(record) => String(record.provider ?? Math.random())}
          dataSource={defaultRows}
          columns={[
            { title: t("common.provider"), dataIndex: "provider" },
            { title: t("common.mode"), dataIndex: "mode" },
          ]}
          pagination={false}
        />
      </Card>

      <Card title={t("common.savedConfigs")} style={{ borderRadius: 16 }}>
        <Table
          rowKey={(record) => String(record.id ?? Math.random())}
          dataSource={configRows}
          columns={[
            { title: t("common.provider"), dataIndex: "provider" },
            { title: t("common.model"), dataIndex: "model" },
            { title: t("common.baseUrl"), dataIndex: "base_url" },
            { title: t("common.enabled"), dataIndex: "enabled", render: (value) => (value ? t("common.yes") : t("common.no")) },
          ]}
        />
      </Card>
    </Space>
  );
}
