import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { money } from "../domain/inventory";
export default function ValueChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  return (
    <div className="value-chart" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 0, right: 12, top: 4, bottom: 0 }}
          barSize={20}
        >
          <CartesianGrid
            horizontal={false}
            stroke="var(--line)"
            strokeDasharray="3 4"
          />
          <XAxis
            type="number"
            tickFormatter={(value) => `$${value}`}
            tick={{ fill: "var(--muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={116}
            tick={{ fill: "var(--ink)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value: string) =>
              value.length > 17 ? `${value.slice(0, 16)}…` : value
            }
          />
          <Tooltip
            cursor={{ fill: "var(--soft)" }}
            contentStyle={{
              background: "var(--paper)",
              border: "1px solid var(--field)",
              borderRadius: 8,
              color: "var(--ink)",
            }}
            formatter={(value) => [money(Number(value)), "Inventory value"]}
          />
          <Bar
            dataKey="value"
            fill="var(--accent)"
            stroke="var(--action-border)"
            strokeWidth={1}
            radius={[0, 4, 4, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
