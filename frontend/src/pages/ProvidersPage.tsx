import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Form, Input, Select, Space, Table, Typography, message } from "antd";

import { api } from "../services/api";

const { Title, Paragraph } = Typography;

const providerOptions = ["openai", "claude", "gemini", "deepseek", "qwen", "doubao"].map((value) => ({
  value,
  label: value,
}));

export function ProvidersPage() {
  const [saveForm] = Form.useForm();
  const [testForm] = Form.useForm();
  const queryClient = useQueryClient();
  const providers = useQuery({ queryKey: ["providers"], queryFn: api.listProviders });
  const defaultRows = (providers.data?.defaults ?? []) as Array<Record<string, string>>;
  const configRows = (providers.data?.configs ?? []) as Array<Record<string, string | number | boolean | null>>;

  const saveMutation = useMutation({
    mutationFn: api.saveProviderConfig,
    onSuccess: () => {
      message.success("Provider config saved");
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
        <Title level={2}>AI Providers</Title>
        <Paragraph>
          Configure OpenAI, Claude, Gemini, DeepSeek, Qwen, or Doubao. Users provide their own API keys; the system stores the
          config and uses it during analysis.
        </Paragraph>
      </div>

      <Card title="Save Config" style={{ borderRadius: 16 }}>
        <Form form={saveForm} layout="vertical" onFinish={(values) => saveMutation.mutate(values)}>
          <Form.Item name="provider" label="Provider" rules={[{ required: true }]}>
            <Select options={providerOptions} />
          </Form.Item>
          <Form.Item name="base_url" label="Base URL">
            <Input placeholder="Optional. Use this for custom compatible endpoints" />
          </Form.Item>
          <Form.Item name="model" label="Model">
            <Input placeholder="Examples: gpt-5-mini / qwen-plus / doubao-seed-1-6-thinking" />
          </Form.Item>
          <Form.Item name="api_key" label="API Key">
            <Input.Password />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={saveMutation.isPending}>
            Save
          </Button>
        </Form>
      </Card>

      <Card title="Test Connection" style={{ borderRadius: 16 }}>
        <Form form={testForm} layout="vertical" onFinish={(values) => testMutation.mutate(values)}>
          <Form.Item name="provider" label="Provider" rules={[{ required: true }]}>
            <Select options={providerOptions} />
          </Form.Item>
          <Form.Item name="base_url" label="Base URL">
            <Input />
          </Form.Item>
          <Form.Item name="model" label="Model">
            <Input />
          </Form.Item>
          <Form.Item name="api_key" label="API Key">
            <Input.Password />
          </Form.Item>
          <Button htmlType="submit" loading={testMutation.isPending}>
            Test
          </Button>
        </Form>
      </Card>

      <Card title="Built-in Provider List" style={{ borderRadius: 16 }}>
        <Table
          rowKey={(record) => String(record.provider ?? Math.random())}
          dataSource={defaultRows}
          columns={[
            { title: "Provider", dataIndex: "provider" },
            { title: "Mode", dataIndex: "mode" },
          ]}
          pagination={false}
        />
      </Card>

      <Card title="Saved Configs" style={{ borderRadius: 16 }}>
        <Table
          rowKey={(record) => String(record.id ?? Math.random())}
          dataSource={configRows}
          columns={[
            { title: "Provider", dataIndex: "provider" },
            { title: "Model", dataIndex: "model" },
            { title: "Base URL", dataIndex: "base_url" },
            { title: "Enabled", dataIndex: "enabled", render: (value) => (value ? "Yes" : "No") },
          ]}
        />
      </Card>
    </Space>
  );
}
