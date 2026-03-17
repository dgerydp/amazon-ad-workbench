import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Card, Form, Input, Select, Space, Switch, Table, Typography, message } from "antd";

import { api } from "../services/api";

const { Paragraph, Title } = Typography;

const providerOptions = ["openai", "claude", "gemini", "deepseek", "qwen", "doubao"].map((value) => ({
  value,
  label: value,
}));

export function ProvidersPage() {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const providers = useQuery({ queryKey: ["providers"], queryFn: api.listProviders });
  const defaultRows = (providers.data?.defaults ?? []) as Array<Record<string, string>>;
  const configRows = (providers.data?.configs ?? []) as Array<Record<string, string | number | boolean | null>>;

  const saveMutation = useMutation({
    mutationFn: api.saveProviderConfig,
    onSuccess: async () => {
      message.success("AI 配置已保存");
      await queryClient.invalidateQueries({ queryKey: ["providers"] });
    },
  });

  const testMutation = useMutation({
    mutationFn: api.testProvider,
    onSuccess: (data) => {
      message.info(data.message);
    },
  });

  const handleTest = async () => {
    const values = await form.validateFields();
    testMutation.mutate(values);
  };

  return (
    <Space direction="vertical" size={24} style={{ display: "flex" }}>
      <div>
        <Title level={2}>AI 配置</Title>
        <Paragraph>
          只有在你想启用 AI 语义打标时才需要配置这里。sellerSKU 归因、规则打标和导出流程本身不依赖 AI。
        </Paragraph>
      </div>

      <Alert
        type="info"
        showIcon
        message="建议"
        description="先把报表上传、规则和分析主流程跑通，再决定是否接入 AI。这样排查问题会更清楚。"
      />

      <Card title="配置中心" style={{ borderRadius: 18 }}>
        <Form form={form} layout="vertical" initialValues={{ enabled: true }} onFinish={(values) => saveMutation.mutate(values)}>
          <Form.Item name="provider" label="服务商" rules={[{ required: true, message: "请选择服务商" }]}>
            <Select options={providerOptions} />
          </Form.Item>
          <Form.Item name="base_url" label="Base URL">
            <Input placeholder="可选，兼容 OpenAI 协议的自定义地址填这里" />
          </Form.Item>
          <Form.Item name="model" label="模型">
            <Input placeholder="例如：gpt-5-mini / qwen-plus / doubao-seed-1-6-thinking" />
          </Form.Item>
          <Form.Item name="api_key" label="API Key">
            <Input.Password />
          </Form.Item>
          <Form.Item name="enabled" label="启用配置" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Space wrap>
            <Button type="primary" htmlType="submit" loading={saveMutation.isPending}>
              保存配置
            </Button>
            <Button onClick={handleTest} loading={testMutation.isPending}>
              测试连接
            </Button>
          </Space>
        </Form>
      </Card>

      <Card title="内置服务商列表" style={{ borderRadius: 18 }}>
        <Table
          rowKey={(record) => String(record.provider)}
          dataSource={defaultRows}
          columns={[
            { title: "服务商", dataIndex: "provider" },
            { title: "模式", dataIndex: "mode" },
          ]}
          pagination={false}
        />
      </Card>

      <Card title="已保存配置" style={{ borderRadius: 18 }}>
        <Table
          rowKey={(record) => String(record.id)}
          dataSource={configRows}
          columns={[
            { title: "服务商", dataIndex: "provider" },
            { title: "模型", dataIndex: "model" },
            { title: "Base URL", dataIndex: "base_url" },
            { title: "启用", dataIndex: "enabled", render: (value) => (value ? "是" : "否") },
          ]}
        />
      </Card>
    </Space>
  );
}
