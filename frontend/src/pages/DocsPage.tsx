import type { ReactNode } from "react";
import { useState } from "react";
import { BookOutlined, FileSearchOutlined, ReadOutlined } from "@ant-design/icons";
import { Card, Col, Row, Space, Tag, Typography } from "antd";

import quickStartZh from "../../../docs/onboarding/quick-start-zh.md?raw";
import deploymentZh from "../../../docs/onboarding/deployment-zh.md?raw";
import quickStartEn from "../../../docs/onboarding/quick-start.md?raw";
import projectOverview from "../../../docs/prd/project-overview.md?raw";
import systemDesign from "../../../docs/architecture/system-design.md?raw";
import dataModel from "../../../docs/architecture/data-model-outline.md?raw";
import apiOutline from "../../../docs/api/api-outline.md?raw";

const { Paragraph, Text, Title } = Typography;

type DocItem = {
  key: string;
  title: string;
  summary: string;
  content: string;
};

const docs: DocItem[] = [
  {
    key: "quick-start-zh",
    title: "快速开始（中文）",
    summary: "给第一次使用的小白用户，按步骤完成本地启动、导入报表和运行分析。",
    content: quickStartZh,
  },
  {
    key: "deployment-zh",
    title: "部署说明（中文）",
    summary: "准备对外提供访问地址时，再看这一份部署说明。",
    content: deploymentZh,
  },
  {
    key: "quick-start-en",
    title: "Quick Start",
    summary: "English onboarding and local startup flow.",
    content: quickStartEn,
  },
  {
    key: "project-overview",
    title: "项目概览",
    summary: "项目目标、边界和为什么保持 sellerSKU-first。",
    content: projectOverview,
  },
  {
    key: "system-design",
    title: "系统设计",
    summary: "核心流程、模块关系和分析链路设计。",
    content: systemDesign,
  },
  {
    key: "data-model",
    title: "数据模型",
    summary: "主要数据表、约束和关联方式。",
    content: dataModel,
  },
  {
    key: "api-outline",
    title: "API 大纲",
    summary: "后端主要接口清单。",
    content: apiOutline,
  },
];

function MarkdownContent({ content }: { content: string }) {
  const blocks: ReactNode[] = [];
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  let paragraphBuffer: string[] = [];
  let listItems: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let codeLines: string[] = [];
  let inCodeBlock = false;

  const flushParagraph = () => {
    if (!paragraphBuffer.length) {
      return;
    }
    blocks.push(
      <Paragraph key={`p-${blocks.length}`} style={{ marginBottom: 12 }}>
        {paragraphBuffer.join(" ")}
      </Paragraph>,
    );
    paragraphBuffer = [];
  };

  const flushList = () => {
    if (!listItems.length || !listType) {
      return;
    }
    const key = `${listType}-${blocks.length}`;
    if (listType === "ol") {
      blocks.push(
        <ol key={key}>
          {listItems.map((item, index) => (
            <li key={`${key}-${index}`}>{item}</li>
          ))}
        </ol>,
      );
    } else {
      blocks.push(
        <ul key={key}>
          {listItems.map((item, index) => (
            <li key={`${key}-${index}`}>{item}</li>
          ))}
        </ul>,
      );
    }
    listItems = [];
    listType = null;
  };

  const flushCode = () => {
    if (!codeLines.length) {
      return;
    }
    blocks.push(
      <pre key={`code-${blocks.length}`}>
        <code>{codeLines.join("\n")}</code>
      </pre>,
    );
    codeLines = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (line.startsWith("```")) {
      flushParagraph();
      flushList();
      if (inCodeBlock) {
        flushCode();
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(rawLine);
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    if (trimmed.startsWith("# ")) {
      flushParagraph();
      flushList();
      blocks.push(
        <Title key={`h1-${blocks.length}`} level={2} style={{ marginTop: 8 }}>
          {trimmed.slice(2)}
        </Title>,
      );
      continue;
    }

    if (trimmed.startsWith("## ")) {
      flushParagraph();
      flushList();
      blocks.push(
        <Title key={`h2-${blocks.length}`} level={3} style={{ marginTop: 20 }}>
          {trimmed.slice(3)}
        </Title>,
      );
      continue;
    }

    if (trimmed.startsWith("### ")) {
      flushParagraph();
      flushList();
      blocks.push(
        <Title key={`h3-${blocks.length}`} level={4} style={{ marginTop: 18, marginBottom: 10 }}>
          {trimmed.slice(4)}
        </Title>,
      );
      continue;
    }

    if (trimmed.startsWith("- ")) {
      flushParagraph();
      if (listType && listType !== "ul") {
        flushList();
      }
      listType = "ul";
      listItems.push(trimmed.slice(2));
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      flushParagraph();
      if (listType && listType !== "ol") {
        flushList();
      }
      listType = "ol";
      listItems.push(trimmed.replace(/^\d+\.\s+/, ""));
      continue;
    }

    if (trimmed.startsWith("> ")) {
      flushParagraph();
      flushList();
      blocks.push(<blockquote key={`quote-${blocks.length}`}>{trimmed.slice(2)}</blockquote>);
      continue;
    }

    flushList();
    paragraphBuffer.push(trimmed);
  }

  flushParagraph();
  flushList();
  flushCode();

  return <div className="docs-markdown">{blocks}</div>;
}

export function DocsPage() {
  const [activeKey, setActiveKey] = useState(docs[0].key);
  const activeDoc = docs.find((item) => item.key === activeKey) ?? docs[0];

  return (
    <Space direction="vertical" size={24} style={{ display: "flex" }} className="page-layout">
      <section className="page-hero">
        <div className="page-hero-main">
          <div className="page-kicker">Knowledge Base</div>
          <Title className="page-title">把项目文档直接收进工作台，不用再跳来跳去翻目录</Title>
          <Paragraph className="page-summary">
            文档页直接读取仓库里的核心说明。先看快速开始跑通流程，再逐步进入部署、架构、数据模型和 API 说明。
          </Paragraph>
          <div className="page-chip-row">
            <div className="page-chip">启动说明</div>
            <div className="page-chip">架构与数据模型</div>
            <div className="page-chip">API 清单</div>
          </div>
        </div>

        <aside className="page-hero-side">
          <div className="page-side-kicker">Doc Pulse</div>
          <div className="page-side-value">{docs.length}</div>
          <div className="page-side-copy">当前已收录的核心文档数</div>
          <div className="page-side-grid">
            <div className="page-side-metric">
              <span>上手文档</span>
              <strong>3</strong>
            </div>
            <div className="page-side-metric">
              <span>架构文档</span>
              <strong>3</strong>
            </div>
            <div className="page-side-metric">
              <span>接口文档</span>
              <strong>1</strong>
            </div>
            <div className="page-side-metric">
              <span>当前阅读</span>
              <strong>{docs.findIndex((item) => item.key === activeKey) + 1}</strong>
            </div>
          </div>
        </aside>
      </section>

      <Row gutter={[16, 16]} align="top">
        <Col xs={24} xl={7}>
          <Card title="文档目录" className="page-section-card">
            <div className="page-doc-nav">
              {docs.map((item) => {
                const active = item.key === activeKey;
                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveKey(item.key)}
                    className={`page-doc-button${active ? " page-doc-button-active" : ""}`}
                  >
                    <div className="page-doc-title">{item.title}</div>
                    <Text className="page-doc-summary">{item.summary}</Text>
                  </button>
                );
              })}
            </div>
          </Card>
        </Col>

        <Col xs={24} xl={17}>
          <Card
            title={activeDoc.title}
            extra={
              <Space>
                <Tag icon={<ReadOutlined />}>阅读</Tag>
                <Tag icon={<FileSearchOutlined />}>仓库原文</Tag>
                <Tag icon={<BookOutlined />}>实时同步</Tag>
              </Space>
            }
            className="page-section-card"
          >
            <MarkdownContent content={activeDoc.content} />
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
