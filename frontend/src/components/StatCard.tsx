import type { ReactNode } from "react";
import { Card } from "antd";

type StatCardProps = {
  title: string;
  value: number | string;
  suffix?: string;
  hint?: string;
  icon?: ReactNode;
  accent?: "blue" | "cyan" | "emerald" | "amber";
};

export function StatCard({ title, value, suffix, hint, icon, accent = "blue" }: StatCardProps) {
  return (
    <Card className={`stat-card stat-card-${accent}`}>
      <div className="stat-card-head">
        <div className="stat-card-title">{title}</div>
        {icon ? <div className="stat-card-icon">{icon}</div> : null}
      </div>
      <div className="stat-card-value">
        {value}
        {suffix ? <span className="stat-card-suffix">{suffix}</span> : null}
      </div>
      {hint ? <div className="stat-card-hint">{hint}</div> : null}
    </Card>
  );
}
