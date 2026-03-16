import { Card, Statistic } from "antd";

export function StatCard(props: { title: string; value: number | string; suffix?: string }) {
  return (
    <Card style={{ borderRadius: 16, boxShadow: "0 10px 30px rgba(20, 40, 20, 0.08)" }}>
      <Statistic title={props.title} value={props.value} suffix={props.suffix} />
    </Card>
  );
}

