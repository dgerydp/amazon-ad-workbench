import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";
import "antd/dist/reset.css";

import { AppShell } from "./app/AppShell";
import "./styles/global.css";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#2f76ff",
          colorInfo: "#2f76ff",
          colorSuccess: "#18b67a",
          colorWarning: "#ff9d2e",
          colorError: "#ff5d73",
          colorText: "#0f172a",
          colorTextSecondary: "#546179",
          colorBgBase: "#f3f7ff",
          colorBgContainer: "#f8fbff",
          colorBgElevated: "#fbfdff",
          colorBorderSecondary: "rgba(95, 132, 198, 0.18)",
          borderRadius: 20,
          borderRadiusLG: 28,
          fontFamily:
            '"Segoe UI Variable Text", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei UI", "Helvetica Neue", sans-serif',
        },
        components: {
          Layout: {
            bodyBg: "transparent",
            siderBg: "transparent",
            headerBg: "transparent",
          },
          Menu: {
            itemBg: "transparent",
            itemColor: "rgba(228, 236, 255, 0.76)",
            itemHoverBg: "rgba(72, 124, 255, 0.18)",
            itemHoverColor: "#ffffff",
            itemSelectedBg: "linear-gradient(90deg, rgba(47, 118, 255, 0.32), rgba(27, 199, 255, 0.22))",
            itemSelectedColor: "#ffffff",
          },
          Card: {
            headerBg: "transparent",
          },
          Table: {
            headerBg: "rgba(227, 237, 255, 0.92)",
            rowHoverBg: "rgba(236, 244, 255, 0.92)",
          },
          Button: {
            controlHeight: 44,
          },
          Input: {
            controlHeight: 44,
          },
          Select: {
            controlHeight: 44,
          },
          InputNumber: {
            controlHeight: 44,
          },
          Segmented: {
            trackBg: "rgba(221, 232, 255, 0.95)",
            itemSelectedBg: "#0f172a",
            itemSelectedColor: "#ffffff",
          },
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <AppShell />
      </QueryClientProvider>
    </ConfigProvider>
  </React.StrictMode>,
);
