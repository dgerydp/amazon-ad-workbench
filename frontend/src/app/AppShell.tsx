import { Suspense, lazy } from "react";

import {
  BarChartOutlined,
  BookOutlined,
  CloudServerOutlined,
  FileSearchOutlined,
  HomeOutlined,
  SettingOutlined,
  ShopOutlined,
  TagsOutlined,
} from "@ant-design/icons";
import { Layout, Menu, Spin, Typography } from "antd";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";

const DashboardPage = lazy(() => import("../pages/DashboardPage").then((module) => ({ default: module.DashboardPage })));
const UploadsPage = lazy(() => import("../pages/UploadsPage").then((module) => ({ default: module.UploadsPage })));
const ShopsPage = lazy(() => import("../pages/ShopsPage").then((module) => ({ default: module.ShopsPage })));
const SellerSkusPage = lazy(() => import("../pages/SellerSkusPage").then((module) => ({ default: module.SellerSkusPage })));
const AnalysisPage = lazy(() => import("../pages/AnalysisPage").then((module) => ({ default: module.AnalysisPage })));
const ProvidersPage = lazy(() => import("../pages/ProvidersPage").then((module) => ({ default: module.ProvidersPage })));
const LingxingPage = lazy(() => import("../pages/LingxingPage").then((module) => ({ default: module.LingxingPage })));
const ExportsPage = lazy(() => import("../pages/ExportsPage").then((module) => ({ default: module.ExportsPage })));
const DocsPage = lazy(() => import("../pages/DocsPage").then((module) => ({ default: module.DocsPage })));
const TagsPage = lazy(() => import("../pages/TagsPage").then((module) => ({ default: module.TagsPage })));

const { Sider, Header, Content } = Layout;
const { Title, Paragraph } = Typography;

const menuItems = [
  { key: "/dashboard", icon: <HomeOutlined />, label: "Overview" },
  { key: "/uploads", icon: <FileSearchOutlined />, label: "Reports" },
  { key: "/shops", icon: <ShopOutlined />, label: "Shops" },
  { key: "/seller-skus", icon: <TagsOutlined />, label: "sellerSKU" },
  { key: "/analysis", icon: <BarChartOutlined />, label: "Analysis" },
  { key: "/tags", icon: <TagsOutlined />, label: "Tags" },
  { key: "/providers", icon: <SettingOutlined />, label: "AI Providers" },
  { key: "/lingxing", icon: <CloudServerOutlined />, label: "Lingxing" },
  { key: "/exports", icon: <FileSearchOutlined />, label: "Exports" },
  { key: "/docs", icon: <BookOutlined />, label: "Docs" },
];

function ShellLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Layout style={{ minHeight: "100vh", background: "linear-gradient(180deg, #f6f0e8 0%, #eef2e8 100%)" }}>
      <Sider theme="light" width={240} style={{ borderRight: "1px solid rgba(30, 60, 30, 0.08)" }}>
        <div style={{ padding: 24 }}>
          <Title level={4} style={{ margin: 0 }}>
            Amazon Ad Workbench
          </Title>
          <Paragraph style={{ marginTop: 8, marginBottom: 0 }}>sellerSKU-first</Paragraph>
        </div>
        <Menu mode="inline" selectedKeys={[location.pathname]} items={menuItems} onClick={({ key }) => navigate(key)} />
      </Sider>
      <Layout>
        <Header style={{ background: "transparent", padding: "20px 32px 0" }}>
          <Title level={3} style={{ margin: 0 }}>
            Amazon Advertising Analysis Workbench
          </Title>
        </Header>
        <Content style={{ padding: 32 }}>
          <Suspense
            fallback={
              <div style={{ minHeight: 240, display: "grid", placeItems: "center" }}>
                <Spin size="large" />
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/uploads" element={<UploadsPage />} />
              <Route path="/shops" element={<ShopsPage />} />
              <Route path="/seller-skus" element={<SellerSkusPage />} />
              <Route path="/analysis" element={<AnalysisPage />} />
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
