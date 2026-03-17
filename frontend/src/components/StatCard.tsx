import { Card } from "antd";

export function StatCard(props: { title: string; value: number | string; suffix?: string }) {
  return (
    <Card className="stat-card">
      <div className="stat-card-title">{props.title}</div>
      <div className="stat-card-value">
        {props.value}
        {props.suffix ? <span className="stat-card-suffix">{props.suffix}</span> : null}
      </div>
    </Card>
  );
}
