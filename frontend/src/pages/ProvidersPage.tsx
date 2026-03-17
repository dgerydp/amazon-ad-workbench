import { ApiOutlined, CloudServerOutlined, LockOutlined, RobotOutlined } from "@ant-design/icons";
import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, AutoComplete, Button, Card, Form, Input, Select, Space, Switch, Table, Tag, Typography, message } from "antd";

import { api } from "../services/api";

const { Paragraph, Text, Title } = Typography;

type ProviderMeta = {
  provider: string;
  label?: string;
  mode?: string;
  default_base_url?: string;
  recommended_models?: string[];
};

const builtInProviders: ProviderMeta[] = [
  {
    provider: "openai",
    label: "OpenAI",
    mode: "native",
    default_base_url: "https://api.openai.com/v1",
    recommended_models: ["gpt-5-mini", "gpt-5", "gpt-4.1-mini"],
  },
  {
    provider: "claude",
    label: "Claude",
    mode: "native",
    default_base_url: "https://api.anthropic.com/v1",
    recommended_models: ["claude-3-5-sonnet-latest", "claude-3-7-sonnet-latest"],
  },
  {
    provider: "gemini",
    label: "Gemini",
    mode: "native",
    default_base_url: "https://generativelanguage.googleapis.com/v1beta",
    recommended_models: ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash"],
  },
  {
    provider: "deepseek",
    label: "DeepSeek",
    mode: "openai_compatible",
    default_base_url: "https://api.deepseek.com/v1",
    recommended_models: ["deepseek-chat", "deepseek-reasoner"],
  },
  {
    provider: "qwen",
    label: "Qwen",
    mode: "openai_compatible",
    default_base_url: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    recommended_models: ["qwen-plus", "qwen-turbo", "qwen-max"],
  },
  {
    provider: "doubao",
    label: "Doubao",
    mode: "openai_compatible",
    default_base_url: "https://ark.cn-beijing.volces.com/api/v3",
    recommended_models: ["doubao-seed-1-6-thinking", "doubao-seed-1-6-flash"],
  },
];

function normalizeProviderList(items: ProviderMeta[] | undefined): ProviderMeta[] {
  if (!items?.length) {
    return builtInProviders;
  }
  return items.map((item) => ({
    provider: item.provider,
    label: item.label || item.provider,
    mode: item.mode,
    default_base_url: item.default_base_url,
    recommended_models: item.recommended_models || [],
  }));
}

export function ProvidersPage() {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const providers = useQuery({ queryKey: ["providers"], queryFn: api.listProviders });
  const providerRows = useMemo(
    () => normalizeProviderList((providers.data?.defaults ?? []) as ProviderMeta[]),
    [providers.data?.defaults],
  );
  const providerOptions = providerRows.map((item) => ({
    value: item.provider,
    label: item.label || item.provider,
  }));
  const selectedProvider = Form.useWatch("provider", form) as string | undefined;
  const selectedMeta = providerRows.find((item) => item.provider === selectedProvider);
  const modelOptions = (selectedMeta?.recommended_models ?? []).map((value) => ({ value }));
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

  const handleProviderChange = (provider: string) => {
    const nextMeta = providerRows.find((item) => item.provider === provider);
    form.setFieldsValue({
      provider,
      base_url: nextMeta?.default_base_url,
      model: nextMeta?.recommended_models?.[0],
    });
  };

  const handleTest = async () => {
    const values = await form.validateFields(["provider", "api_key", "model", "base_url"]);
    testMutation.mutate(values);
  };

  return (
    <Space direction="vertical" size={24} style={{ display: "flex" }} className="page-layout">
      <section className="page-hero">
        <div className="page-hero-main">
          <div className="page-kicker">Provider Control</div>
          <Title className="page-title">把 AI 能力接进来，但别让模型配置拖垮主流程</Title>
          <Paragraph className="page-summary">
            Provider 页的目标很明确：把模型接入做成可替换、可测试、可保存的基础设施。先跑通业务链路，再把 AI 叠上去，排错成本最低。
          </Paragraph>
          <div className="page-chip-row">
            <div className="page-chip">Native API / OpenAI Compatible</div>
            <div className="page-chip">推荐模型自动带出</div>
            <div className="page-chip">支持本地保存与连通性测试</div>
          </div>
        </div>

        <aside className="page-hero-side">
          <div className="page-side-kicker">Provider Pulse</div>
          <div className="page-side-value">{providerRows.length}</div>
          <div className="page-side-copy">内置 Provider 数量</div>
          <div className="page-side-grid">
            <div className="page-side-metric">
              <span>已保存配置</span>
              <strong>{configRows.length}</strong>
            </div>
            <div className="page-side-metric">
              <span>已启用</span>
              <strong>{configRows.filter((item) => item.enabled).length}</strong>
            </div>
            <div className="page-side-metric">
              <span>接入模式</span>
              <strong>2</strong>
            </div>
            <div className="page-side-metric">
              <span>用途</span>
              <strong>AI</strong>
            </div>
          </div>
        </aside>
      </section>

      <Alert
        type="info"
        showIcon
        message="使用建议"
        description="先跑通报表上传和基础分析，再启用 AI 打标。分析页会自动复用这里“已启用”的配置，不需要你在分析页再次填写 Provider 或模型。"
      />

      <div className="page-dual-grid">
        <Card title="保存配置" className="page-section-card">
          <Form form={form} layout="vertical" initialValues={{ enabled: true }} onFinish={(values) => saveMutation.mutate(values)}>
            <Form.Item name="provider" label="Provider" rules={[{ required: true, message: "请选择 Provider" }]}>
              <Select
                placeholder="请选择 AI 服务商"
                options={providerOptions}
                onChange={handleProviderChange}
                loading={providers.isLoading}
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>

            <Form.Item label="模式">
              <Tag color={selectedMeta?.mode === "openai_compatible" ? "gold" : "blue"}>
                {selectedMeta?.mode === "openai_compatible" ? "OpenAI Compatible" : selectedMeta?.mode === "native" ? "Native API" : "未选择"}
              </Tag>
            </Form.Item>

            <Form.Item name="model" label="模型">
              <AutoComplete
                options={modelOptions}
                placeholder={selectedMeta ? "可直接选推荐模型，也可以手动输入" : "请先选择 Provider"}
                disabled={!selectedMeta}
                filterOption={(inputValue, option) =>
                  String(option?.value ?? "")
                    .toLowerCase()
                    .includes(inputValue.toLowerCase())
                }
              />
            </Form.Item>

            <Form.Item name="base_url" label="Base URL">
              <Input placeholder={selectedMeta?.default_base_url || "会按 Provider 自动带出默认地址，也可以手动覆盖"} />
            </Form.Item>

            {selectedMeta?.default_base_url ? (
              <Paragraph type="secondary" style={{ marginTop: -8 }}>
                默认地址：{selectedMeta.default_base_url}
              </Paragraph>
            ) : null}

            <Form.Item name="api_key" label="API Key">
              <Input.Password placeholder="仅保存在本地数据库，不会显示明文" />
            </Form.Item>

            <Form.Item name="enabled" label="启用配置" valuePropName="checked">
              <Switch />
            </Form.Item>

            <Space wrap>
              <Button type="primary" htmlType="submit" loading={saveMutation.isPending}>
                保存
              </Button>
              <Button onClick={handleTest} loading={testMutation.isPending}>
                测试连接
              </Button>
            </Space>
          </Form>
        </Card>

        <Card title="接入说明" className="page-section-card">
          <div className="page-action-grid">
            <div className="page-action-card">
              <div className="page-action-icon">
                <RobotOutlined />
              </div>
              <div className="page-action-title">选择 Provider</div>
              <div className="page-action-copy">优先选择团队已经验证过的模型和默认地址，减少兼容性成本。</div>
            </div>
            <div className="page-action-card">
              <div className="page-action-icon">
                <ApiOutlined />
              </div>
              <div className="page-action-title">测试连接</div>
              <div className="page-action-copy">在真正参与分析前先做连通性验证，避免任务运行时才暴露问题。</div>
            </div>
            <div className="page-action-card">
              <div className="page-action-icon">
                <LockOutlined />
              </div>
              <div className="page-action-title">启用控制</div>
              <div className="page-action-copy">只会使用启用中的配置，方便你保留多套候选 Provider 做切换。</div>
            </div>
            <div className="page-action-card">
              <div className="page-action-icon">
                <CloudServerOutlined />
              </div>
              <div className="page-action-title">模型复用</div>
              <div className="page-action-copy">保存后分析页可直接复用，不需要每次重新输入模型和密钥。</div>
            </div>
          </div>
        </Card>
      </div>

      <Card title="内置 Provider" className="page-table-card">
        <Table
          rowKey={(record) => String(record.provider)}
          dataSource={providerRows}
          pagination={false}
          columns={[
            { title: "Provider", dataIndex: "label" },
            { title: "模式", dataIndex: "mode" },
            { title: "默认 Base URL", dataIndex: "default_base_url" },
            {
              title: "推荐模型",
              dataIndex: "recommended_models",
              render: (value: string[] | undefined) =>
                value?.length ? (
                  <Space wrap>{value.map((item) => <Tag key={item}>{item}</Tag>)}</Space>
                ) : (
                  "-"
                ),
            },
          ]}
        />
      </Card>

      <Card title="已保存配置" className="page-table-card">
        <Table
          rowKey={(record) => String(record.id)}
          dataSource={configRows}
          columns={[
            { title: "Provider", dataIndex: "provider" },
            { title: "模型", dataIndex: "model" },
            { title: "Base URL", dataIndex: "base_url" },
            {
              title: "API Key",
              dataIndex: "has_api_key",
              render: (value) => <Tag color={value ? "green" : "default"}>{value ? "已保存" : "未保存"}</Tag>,
            },
            {
              title: "启用",
              dataIndex: "enabled",
              render: (value) => <Tag color={value ? "blue" : "default"}>{value ? "当前生效" : "未启用"}</Tag>,
            },
          ]}
        />
      </Card>
    </Space>
  );
}
