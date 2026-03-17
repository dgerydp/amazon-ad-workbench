import { Suspense, lazy } from "react";

import {
  BarChartOutlined,
  CloudServerOutlined,
  ControlOutlined,
  ExportOutlined,
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

const { Content, Header, Sider } = Layout;
const { Title } = Typography;

const menuItems = [
  { key: "/dashboard", icon: <HomeOutlined />, label: "概览" },
  { key: "/uploads", icon: <UploadOutlined />, label: "报表上传" },
  { key: "/analysis", icon: <BarChartOutlined />, label: "分析" },
  { key: "/rules", icon: <ControlOutlined />, label: "规则配置" },
  { key: "/tags", icon: <TagsOutlined />, label: "标签" },
  { key: "/providers", icon: <SettingOutlined />, label: "AI 配置" },
  { key: "/lingxing", icon: <CloudServerOutlined />, label: "领星同步" },
  { key: "/exports", icon: <ExportOutlined />, label: "导出" },
];

function ShellLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Layout className="app-shell">
      <Sider className="app-sider" theme="light" width={280}>
        <div className="app-brand">
          <div className="app-brand-mark">SIGNAL LAB</div>
          <Title level={4} className="app-brand-title">
            亚马逊广告信号台
          </Title>
        </div>
        <Menu
          className="app-menu"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout className="app-main">
        <Header className="app-header">
          <div className="app-header-panel">
            <Title level={2} className="app-header-title">
              广告词信号分析台
            </Title>
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
