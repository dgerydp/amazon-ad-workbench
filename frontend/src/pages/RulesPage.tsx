import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  Tag,
  Typography,
  message,
} from "antd";
import { ControlOutlined, DeleteOutlined, EditOutlined, PlusOutlined, RadarChartOutlined, TagsOutlined } from "@ant-design/icons";

import { api } from "../services/api";
import type { CombinationRule, PerformanceRule, RuleCondition, RuleGroup } from "../types/api";

const { Paragraph, Text, Title } = Typography;
const OPERATORS = [">=", "<=", ">", "<", "==", "!="];

const createEmptyRule = (): PerformanceRule => ({
  name: "新规则",
  icon: "N",
  color: "#1677ff",
  priority: 99,
  conditions: [{ field: "total_clicks", op: ">=", value: 10 }],
  description: "",
  action_advice: "",
  is_active: true,
});

export function RulesPage() {
  const queryClient = useQueryClient();
  const [combinationForm] = Form.useForm<CombinationRule>();
  const [groupDrafts, setGroupDrafts] = useState<RuleGroup[]>([]);
  const [combinationModalOpen, setCombinationModalOpen] = useState(false);
  const [editingCombination, setEditingCombination] = useState<CombinationRule | null>(null);

  const ruleGroups = useQuery({ queryKey: ["rule-groups"], queryFn: api.getRuleGroups });
  const combinations = useQuery({ queryKey: ["combination-rules"], queryFn: api.getCombinationRules });

  useEffect(() => {
    setGroupDrafts(ruleGroups.data?.groups ?? []);
  }, [ruleGroups.data]);

  const fieldOptions = ruleGroups.data?.field_options ?? [];
  const combinationRules = combinations.data?.rules ?? [];
  const totalRules = groupDrafts.reduce((sum, group) => sum + group.rules.length, 0);
  const activeGroups = groupDrafts.filter((group) => group.is_active).length;

  const refreshAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["rule-groups"] }),
      queryClient.invalidateQueries({ queryKey: ["combination-rules"] }),
      queryClient.invalidateQueries({ queryKey: ["rule-hits"] }),
      queryClient.invalidateQueries({ queryKey: ["tokens"] }),
      queryClient.invalidateQueries({ queryKey: ["search-terms"] }),
    ]);
  };

  const groupMutation = useMutation({
    mutationFn: ({ groupId, payload }: { groupId: number; payload: { description?: string | null; is_active: boolean; priority: number } }) =>
      api.updateRuleGroup(groupId, payload),
    onSuccess: async () => {
      message.success("规则组已更新");
      await refreshAll();
    },
  });

  const saveRuleMutation = useMutation({
    mutationFn: ({ groupId, rule }: { groupId: number; rule: PerformanceRule }) =>
      rule.id ? api.updateRule(rule.id, rule) : api.createRule({ ...rule, group_id: groupId }),
    onSuccess: async () => {
      message.success("规则已保存");
      await refreshAll();
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: api.deleteRule,
    onSuccess: async () => {
      message.success("规则已删除");
      await refreshAll();
    },
  });

  const saveCombinationMutation = useMutation({
    mutationFn: (payload: CombinationRule) =>
      payload.id ? api.updateCombinationRule(payload.id, payload) : api.createCombinationRule(payload),
    onSuccess: async () => {
      message.success("策略已保存");
      setCombinationModalOpen(false);
      setEditingCombination(null);
      await refreshAll();
    },
  });

  const deleteCombinationMutation = useMutation({
    mutationFn: api.deleteCombinationRule,
    onSuccess: async () => {
      message.success("策略已删除");
      await refreshAll();
    },
  });

  const labelOptionsByGroup = useMemo(
    () =>
      groupDrafts.map((group) => ({
        group_name: group.name,
        options: group.rules.map((rule) => ({ label: rule.name, value: rule.name })),
      })),
    [groupDrafts],
  );

  const updateGroupDraft = (groupId: number, updater: (group: RuleGroup) => RuleGroup) => {
    setGroupDrafts((current) => current.map((group) => (group.id === groupId ? updater(group) : group)));
  };

  const updateRuleDraft = (groupId: number, ruleIndex: number, patch: Partial<PerformanceRule>) => {
    updateGroupDraft(groupId, (group) => ({
      ...group,
      rules: group.rules.map((rule, index) => (index === ruleIndex ? { ...rule, ...patch } : rule)),
    }));
  };

  const updateRuleCondition = (groupId: number, ruleIndex: number, conditionIndex: number, patch: Partial<RuleCondition>) => {
    updateGroupDraft(groupId, (group) => ({
      ...group,
      rules: group.rules.map((rule, index) =>
        index !== ruleIndex
          ? rule
          : {
              ...rule,
              conditions: rule.conditions.map((condition, currentIndex) =>
                currentIndex === conditionIndex ? { ...condition, ...patch } : condition,
              ),
            },
      ),
    }));
  };

  const openCombinationModal = (rule?: CombinationRule) => {
    const nextValue: CombinationRule =
      rule ?? {
        name: "",
        icon: "S",
        color: "#1677ff",
        priority: 99,
        description: "",
        action_advice: "",
        is_active: true,
        tag_conditions: [],
      };
    setEditingCombination(rule ?? null);
    combinationForm.setFieldsValue(nextValue);
    setCombinationModalOpen(true);
  };

  if (ruleGroups.isLoading && combinations.isLoading) {
    return (
      <div className="page-loading">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Space direction="vertical" size={24} style={{ display: "flex" }} className="page-layout">
      <section className="page-hero">
        <div className="page-hero-main">
          <div className="page-kicker">Rule Matrix</div>
          <Title className="page-title">把规则组和组合策略做成一套清晰的判断矩阵</Title>
          <Paragraph className="page-summary">
            这里负责维护表现标签和组合决策。先由规则组命中单点标签，再通过策略矩阵组合成最终动作，适合持续迭代运营逻辑。
          </Paragraph>
          <div className="page-chip-row">
            <div className="page-chip">规则组</div>
            <div className="page-chip">条件表达式</div>
            <div className="page-chip">组合策略</div>
          </div>
        </div>

        <aside className="page-hero-side">
          <div className="page-side-kicker">Rule Pulse</div>
          <div className="page-side-value">{groupDrafts.length}</div>
          <div className="page-side-copy">当前规则组数量</div>
          <div className="page-side-grid">
            <div className="page-side-metric">
              <span>总规则数</span>
              <strong>{totalRules}</strong>
            </div>
            <div className="page-side-metric">
              <span>启用组</span>
              <strong>{activeGroups}</strong>
            </div>
            <div className="page-side-metric">
              <span>组合策略</span>
              <strong>{combinationRules.length}</strong>
            </div>
            <div className="page-side-metric">
              <span>字段维度</span>
              <strong>{fieldOptions.length}</strong>
            </div>
          </div>
        </aside>
      </section>

      <Alert
        type="info"
        showIcon
        message="逻辑说明"
        description="每个规则组会先命中一条表现标签，再由策略矩阵按多个标签组合生成最终动作。组与组之间是叠加关系，策略条件支持多标签多选。"
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card className="page-section-card">
            <div className="page-stat-label">Rule Groups</div>
            <div className="page-stat-value">
              <ControlOutlined /> {groupDrafts.length}
            </div>
            <div className="page-stat-help">表现标签按组维护，便于分层管理和排序。</div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="page-section-card">
            <div className="page-stat-label">Rules</div>
            <div className="page-stat-value">
              <TagsOutlined /> {totalRules}
            </div>
            <div className="page-stat-help">所有规则组下累计的规则条目数。</div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="page-section-card">
            <div className="page-stat-label">Strategy Matrix</div>
            <div className="page-stat-value">
              <RadarChartOutlined /> {combinationRules.length}
            </div>
            <div className="page-stat-help">按多标签组合生成最终动作建议的策略数。</div>
          </Card>
        </Col>
      </Row>

      <Space direction="vertical" size={20} style={{ display: "flex" }}>
        {groupDrafts.length ? (
          groupDrafts.map((group) => (
            <Card key={group.id} className="rules-group-card" title={null} style={{ borderRadius: 24 }}>
              <div className="rules-group-header">
                <div className="rules-group-copy">
                  <Space wrap size={10}>
                    <Title level={4} style={{ margin: 0 }}>
                      {group.name}
                    </Title>
                    <Tag color={group.is_active ? "blue" : "default"}>{group.is_active ? "启用中" : "已停用"}</Tag>
                  </Space>
                  <Paragraph style={{ marginTop: 10, marginBottom: 0, color: "#60708c" }}>
                    {group.description || "当前分组还没有说明，建议补一句这个分组主要判断什么。"}
                  </Paragraph>
                </div>
                <Space wrap>
                  <Text type="secondary">优先级</Text>
                  <InputNumber
                    min={0}
                    value={group.priority}
                    onChange={(value) => updateGroupDraft(group.id, (current) => ({ ...current, priority: Number(value ?? 0) }))}
                  />
                  <Switch
                    checked={group.is_active}
                    onChange={(checked) =>
                      groupMutation.mutate({
                        groupId: group.id,
                        payload: { description: group.description, priority: group.priority, is_active: checked },
                      })
                    }
                  />
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() =>
                      updateGroupDraft(group.id, (current) => ({
                        ...current,
                        rules: current.rules.concat(createEmptyRule()),
                      }))
                    }
                  >
                    新增规则
                  </Button>
                </Space>
              </div>

              <div className="rules-grid">
                {group.rules.map((rule, ruleIndex) => (
                  <Card
                    key={rule.id ?? `${group.id}-${ruleIndex}`}
                    className="rule-tile"
                    size="small"
                    style={{ borderTop: `3px solid ${rule.color || "#1677ff"}` }}
                    title={null}
                  >
                    <div className="rule-header">
                      <Space wrap>
                        <Input
                          size="small"
                          value={rule.icon ?? ""}
                          onChange={(event) => updateRuleDraft(group.id, ruleIndex, { icon: event.target.value })}
                          style={{ width: 56 }}
                        />
                        <Input
                          size="small"
                          value={rule.name}
                          onChange={(event) => updateRuleDraft(group.id, ruleIndex, { name: event.target.value })}
                          style={{ width: 180 }}
                        />
                        <Input
                          size="small"
                          value={rule.color ?? ""}
                          onChange={(event) => updateRuleDraft(group.id, ruleIndex, { color: event.target.value })}
                          style={{ width: 112 }}
                        />
                      </Space>
                      <Space wrap>
                        <InputNumber
                          size="small"
                          min={0}
                          value={rule.priority}
                          onChange={(value) => updateRuleDraft(group.id, ruleIndex, { priority: Number(value ?? 0) })}
                        />
                        <Switch
                          size="small"
                          checked={rule.is_active}
                          onChange={(checked) => updateRuleDraft(group.id, ruleIndex, { is_active: checked })}
                        />
                        {rule.id ? (
                          <Popconfirm title="确认删除这条规则？" onConfirm={() => deleteRuleMutation.mutate(rule.id!)}>
                            <Button size="small" danger icon={<DeleteOutlined />} />
                          </Popconfirm>
                        ) : null}
                      </Space>
                    </div>

                    <div
                      className="rule-preview"
                      style={{
                        background: `${rule.color || "#1677ff"}14`,
                        border: `1px solid ${rule.color || "#1677ff"}55`,
                        color: rule.color || "#1677ff",
                      }}
                    >
                      <span>{rule.icon}</span>
                      <span>{rule.name}</span>
                    </div>

                    <Text type="secondary">命中条件</Text>
                    <div className="rule-cond-list">
                      {rule.conditions.map((condition, conditionIndex) => (
                        <Row gutter={8} key={`${group.id}-${ruleIndex}-${conditionIndex}`}>
                          <Col span={10}>
                            <Select
                              size="small"
                              value={condition.field}
                              options={fieldOptions}
                              onChange={(value) => updateRuleCondition(group.id, ruleIndex, conditionIndex, { field: value })}
                              style={{ width: "100%" }}
                            />
                          </Col>
                          <Col span={5}>
                            <Select
                              size="small"
                              value={condition.op}
                              options={OPERATORS.map((value) => ({ value, label: value }))}
                              onChange={(value) => updateRuleCondition(group.id, ruleIndex, conditionIndex, { op: value })}
                              style={{ width: "100%" }}
                            />
                          </Col>
                          <Col span={5}>
                            <InputNumber
                              size="small"
                              value={condition.value}
                              onChange={(value) => updateRuleCondition(group.id, ruleIndex, conditionIndex, { value: Number(value ?? 0) })}
                              style={{ width: "100%" }}
                            />
                          </Col>
                          <Col span={4}>
                            <Button
                              size="small"
                              danger
                              block
                              onClick={() =>
                                updateGroupDraft(group.id, (current) => ({
                                  ...current,
                                  rules: current.rules.map((currentRule, currentIndex) =>
                                    currentIndex !== ruleIndex
                                      ? currentRule
                                      : {
                                          ...currentRule,
                                          conditions: currentRule.conditions.filter((_, index) => index !== conditionIndex),
                                        },
                                  ),
                                }))
                              }
                            >
                              删
                            </Button>
                          </Col>
                        </Row>
                      ))}
                    </div>

                    <Button
                      size="small"
                      type="dashed"
                      onClick={() =>
                        updateGroupDraft(group.id, (current) => ({
                          ...current,
                          rules: current.rules.map((currentRule, currentIndex) =>
                            currentIndex !== ruleIndex
                              ? currentRule
                              : {
                                  ...currentRule,
                                  conditions: currentRule.conditions.concat({ field: "total_clicks", op: ">=", value: 0 }),
                                },
                          ),
                        }))
                      }
                    >
                      添加条件
                    </Button>

                    <div>
                      <Text type="secondary" style={{ display: "block", marginBottom: 6 }}>
                        规则说明
                      </Text>
                      <Input.TextArea
                        rows={2}
                        value={rule.description ?? ""}
                        onChange={(event) => updateRuleDraft(group.id, ruleIndex, { description: event.target.value })}
                      />
                    </div>

                    <div>
                      <Text type="secondary" style={{ display: "block", marginBottom: 6 }}>
                        建议动作
                      </Text>
                      <Input.TextArea
                        rows={2}
                        value={rule.action_advice ?? ""}
                        onChange={(event) => updateRuleDraft(group.id, ruleIndex, { action_advice: event.target.value })}
                      />
                    </div>

                    <div className="rule-footer">
                      <Button type="primary" size="small" onClick={() => saveRuleMutation.mutate({ groupId: group.id, rule })}>
                        保存规则
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          ))
        ) : (
          <Card style={{ borderRadius: 24 }}>
            <Empty description="当前没有可编辑的规则组" />
          </Card>
        )}
      </Space>

      <Card
        title="策略矩阵"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openCombinationModal()}>
            新增策略
          </Button>
        }
        style={{ borderRadius: 24 }}
      >
        {(combinations.data?.rules ?? []).length ? (
          <div className="combination-grid">
            {(combinations.data?.rules ?? []).map((rule) => (
              <Card key={rule.id} className="combination-card" size="small" style={{ borderTop: `3px solid ${rule.color || "#1677ff"}` }}>
                <Space direction="vertical" size={12} style={{ display: "flex" }}>
                  <div className="rule-header">
                    <Space wrap>
                      <Tag color={rule.color || "blue"}>
                        {rule.icon} {rule.name}
                      </Tag>
                      <Text type="secondary">优先级 {rule.priority}</Text>
                    </Space>
                    <Space wrap>
                      <Switch
                        size="small"
                        checked={rule.is_active}
                        onChange={(checked) => saveCombinationMutation.mutate({ ...rule, is_active: checked })}
                      />
                      <Button size="small" icon={<EditOutlined />} onClick={() => openCombinationModal(rule)}>
                        编辑
                      </Button>
                      <Popconfirm title="确认删除这条策略？" onConfirm={() => rule.id && deleteCombinationMutation.mutate(rule.id)}>
                        <Button size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </Space>
                  </div>

                  <Paragraph style={{ marginBottom: 0 }}>{rule.description || "未填写策略说明。"}</Paragraph>
                  <Text type="secondary">{rule.action_advice || "未填写动作建议。"}</Text>

                  <Space wrap size={[8, 8]}>
                    {(rule.tag_conditions ?? []).length ? (
                      rule.tag_conditions.map((item) => (
                        <Tag key={`${rule.id}-${item.group_name}`} bordered={false} color="geekblue">
                          {item.group_name}: {item.tags.join(" / ")}
                        </Tag>
                      ))
                    ) : (
                      <Tag>兜底策略</Tag>
                    )}
                  </Space>
                </Space>
              </Card>
            ))}
          </div>
        ) : (
          <Empty description="当前还没有策略规则" />
        )}
      </Card>

      <Modal
        open={combinationModalOpen}
        title={editingCombination?.id ? "编辑策略" : "新增策略"}
        width={860}
        confirmLoading={saveCombinationMutation.isPending}
        onCancel={() => setCombinationModalOpen(false)}
        onOk={async () => {
          const values = await combinationForm.validateFields();
          saveCombinationMutation.mutate(editingCombination?.id ? { ...editingCombination, ...values } : values);
        }}
      >
        <Form form={combinationForm} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} md={10}>
              <Form.Item name="name" label="策略名称" rules={[{ required: true, message: "请输入策略名称" }]}>
                <Input placeholder="例如：重点培养" />
              </Form.Item>
            </Col>
            <Col xs={12} md={4}>
              <Form.Item name="icon" label="图标">
                <Input placeholder="字母或 emoji" />
              </Form.Item>
            </Col>
            <Col xs={12} md={5}>
              <Form.Item name="color" label="颜色">
                <Input placeholder="#1677ff" />
              </Form.Item>
            </Col>
            <Col xs={24} md={5}>
              <Form.Item name="priority" label="优先级" rules={[{ required: true, message: "请输入优先级" }]}>
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="策略说明">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.Item name="action_advice" label="动作建议">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Card size="small" title="标签组合条件">
            <Form.List name="tag_conditions">
              {(fields, { add, remove }) => (
                <Space direction="vertical" size={12} style={{ display: "flex" }}>
                  {fields.map((field) => (
                    <Row gutter={12} key={field.key}>
                      <Col xs={24} md={8}>
                        <Form.Item
                          {...field}
                          name={[field.name, "group_name"]}
                          label="规则组"
                          rules={[{ required: true, message: "请选择规则组" }]}
                        >
                          <Select options={labelOptionsByGroup.map((item) => ({ value: item.group_name, label: item.group_name }))} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={13}>
                        <Form.Item shouldUpdate noStyle>
                          {() => {
                            const groupName = combinationForm.getFieldValue(["tag_conditions", field.name, "group_name"]);
                            const selectedGroup = labelOptionsByGroup.find((item) => item.group_name === groupName);
                            return (
                              <Form.Item
                                {...field}
                                name={[field.name, "tags"]}
                                label="命中的标签"
                                rules={[{ required: true, message: "请至少选择一个标签" }]}
                              >
                                <Select mode="multiple" options={selectedGroup?.options ?? []} placeholder="支持多选" />
                              </Form.Item>
                            );
                          }}
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={3}>
                        <Form.Item label="操作">
                          <Button danger block onClick={() => remove(field.name)}>
                            删除
                          </Button>
                        </Form.Item>
                      </Col>
                    </Row>
                  ))}
                  <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ group_name: undefined, tags: [] })}>
                    添加组合条件
                  </Button>
                </Space>
              )}
            </Form.List>
          </Card>

          <Form.Item name="is_active" label="启用策略" valuePropName="checked" style={{ marginTop: 16 }}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
