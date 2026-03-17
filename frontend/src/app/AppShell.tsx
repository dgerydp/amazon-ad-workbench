import { Suspense, lazy } from "react";
import {
  BarChartOutlined,
  CloudServerOutlined,
  ControlOutlined,
  ExportOutlined,
  FileTextOutlined,
  HomeOutlined,
  SettingOutlined,
  TagsOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { Layout, Menu, Spin, Typography } from "antd";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";

const DashboardPage = lazy(() => import("../pages/DashboardPage").then((module) => ({ default: module.DashboardPage })));
const UploadsPage = lazy(() => import("../pages/UploadsPage").then((module) => ({ default: module.UploadsPage })));
const AnalysisPage = lazy(() => import("../pages/AnalysisPage").then((module) => ({ default: module.AnalysisPage })));
const RulesPage = lazy(() => import("../pages/RulesPage").then((module) => ({ default: module.RulesPage })));
const TagsPage = lazy(() => import("../pages/TagsPage").then((module) => ({ default: module.TagsPage })));
const ProvidersPage = lazy(() => import("../pages/ProvidersPage").then((module) => ({ default: module.ProvidersPage })));
const LingxingPage = lazy(() => import("../pages/LingxingPage").then((module) => ({ default: module.LingxingPage })));
const ExportsPage = lazy(() => import("../pages/ExportsPage").then((module) => ({ default: module.ExportsPage })));
const DocsPage = lazy(() => import("../pages/DocsPage").then((module) => ({ default: module.DocsPage })));

const { Content, Header, Sider } = Layout;
const { Paragraph, Text, Title } = Typography;

const menuItems = [
  { key: "/dashboard", icon: <HomeOutlined />, label: "总览", description: "查看报表规模、规则命中和标签分布。" },
  { key: "/uploads", icon: <UploadOutlined />, label: "报表上传", description: "导入搜索词报表和投放商品报表。" },
  { key: "/analysis", icon: <BarChartOutlined />, label: "分析", description: "运行 sellerSKU 归因、拆词和打标流程。" },
  { key: "/rules", icon: <ControlOutlined />, label: "规则配置", description: "维护规则组、动作标签和组合决策。" },
  { key: "/tags", icon: <TagsOutlined />, label: "标签", description: "查看语义标签和规则标签落点。" },
  { key: "/providers", icon: <SettingOutlined />, label: "AI 配置", description: "管理模型、密钥和可用 Provider。" },
  { key: "/lingxing", icon: <CloudServerOutlined />, label: "领星同步", description: "同步店铺与 sellerSKU 基础数据。" },
  { key: "/exports", icon: <ExportOutlined />, label: "导出", description: "导出分析结果和运营动作清单。" },
  { key: "/docs", icon: <FileTextOutlined />, label: "文档", description: "查看接入说明和使用指南。" },
];

function ShellLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentSection = menuItems.find((item) => item.key === location.pathname) ?? menuItems[0];

  return (
    <Layout className="app-shell">
      <Sider className="app-sider" theme="light" width={296} breakpoint="lg" collapsedWidth={0}>
        <div className="app-brand">
          <div className="app-brand-stack">
            <div className="app-brand-logo">
              <span className="app-brand-logo-core">A</span>
            </div>
            <div>
              <div className="app-brand-mark">Amazon Ads</div>
              <Title level={4} className="app-brand-title">
                Signal Workbench
              </Title>
              <Text className="app-brand-subtitle">sellerSKU 驱动的广告分析台</Text>
            </div>
          </div>
          <Paragraph className="app-brand-copy">
            把搜索词、规则、标签和导出动作收拢到一个更清晰的工作流里。
          </Paragraph>
        </div>
        <Menu
          className="app-menu"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems.map(({ description, ...item }) => item)}
          onClick={({ key }) => navigate(key)}
        />
        <div className="app-sider-foot">
          <div className="app-sider-foot-label">Current Module</div>
          <div className="app-sider-foot-value">{currentSection.label}</div>
          <Text className="app-sider-foot-copy">{currentSection.description}</Text>
        </div>
      </Sider>
      <Layout className="app-main">
        <Header className="app-header">
          <div className="app-header-panel">
            <div className="app-header-copy">
              <Text className="app-header-kicker">Amazon Ads Signal Deck</Text>
              <Title level={2} className="app-header-title">
                亚马逊广告分析工作台
              </Title>
              <Paragraph className="app-header-summary">
                围绕 sellerSKU 聚合报表、规则、标签和导出动作，快速定位值得放大和该及时处理的关键词信号。
              </Paragraph>
            </div>
            <div className="app-header-meta">
              <div className="app-header-chip app-header-chip-active">{currentSection.label}</div>
              <div className="app-header-chip">sellerSKU Core</div>
              <div className="app-header-chip">Signal Driven</div>
            </div>
            <div className="app-header-orb" />
          </div>
        </Header>
        <Content className="app-content">
          <Suspense
            fallback={
              <div className="page-loading">
                <Spin size="large" />
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/uploads" element={<UploadsPage />} />
              <Route path="/analysis" element={<AnalysisPage />} />
              <Route path="/rules" element={<RulesPage />} />
              <Route path="/tags" element={<TagsPage />} />
              <Route path="/providers" element={<ProvidersPage />} />
              <Route path="/lingxing" element={<LingxingPage />} />
              <Route path="/exports" element={<ExportsPage />} />
              <Route path="/docs" element={<DocsPage />} />
            </Routes>
          </Suspense>
        </Content>
      </Layout>
    </Layout>
  );
}

export function AppShell() {
  return (
    <BrowserRouter>
      <ShellLayout />
    </BrowserRouter>
  );
}
