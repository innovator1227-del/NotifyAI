import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { allNotificationsQuery } from "@/lib/queries";
import {
  EmptyState,
  PageHeader,
  PLATFORM_META,
} from "@/components/notify/bits";
import { tooltipStyle } from "./dashboard";
export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — NotifyAI" },
      { name: "description", content: "Notification analytics." },
    ],
  }),
  component: Analytics,
});
const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--low)",
  "var(--medium)",
];
const PCOL = {
  critical: "var(--critical)",
  high: "var(--high)",
  medium: "var(--medium)",
  low: "var(--low)",
};
function Card({ title, children }) {
  return _jsxs("div", {
    className: "rounded-xl border bg-card p-4 shadow-card",
    children: [
      _jsx("h3", { className: "mb-3 text-sm font-semibold", children: title }),
      children,
    ],
  });
}
const count = (rows, key) => {
  const m = {};
  rows.forEach((r) => (m[key(r)] = (m[key(r)] ?? 0) + 1));
  return Object.entries(m)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};
function Analytics() {
  const [days, setDays] = useState("30");
  const { data, isLoading } = useQuery(allNotificationsQuery(Number(days)));
  const a = useMemo(() => {
    const rows = data ?? [];
    const buckets = {};
    for (let i = Number(days) - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400_000).toISOString().slice(5, 10);
      buckets[d] = { d, total: 0, ai: 0, fallback: 0 };
    }
    rows.forEach((r) => {
      const b = buckets[r.received_at.slice(5, 10)];
      if (!b) return;
      b.total++;
      if (r.ai_source === "ai") b.ai++;
      if (r.ai_source === "fallback") b.fallback++;
    });
    return {
      volume: Object.values(buckets),
      platform: count(
        rows,
        (r) => PLATFORM_META[r.platform]?.label ?? r.platform,
      ),
      category: count(rows, (r) => r.category),
      priority: count(rows, (r) => r.priority),
      read: [
        { name: "Read", value: rows.filter((r) => r.read_status).length },
        { name: "Unread", value: rows.filter((r) => !r.read_status).length },
      ],
      senders: count(rows, (r) => r.sender_name).slice(0, 8),
      total: rows.length,
    };
  }, [data, days]);
  return _jsxs("div", {
    children: [
      _jsx(PageHeader, {
        title: "Analytics",
        description: `${a.total} notifications in range`,
        actions: _jsx(Tabs, {
          value: days,
          onValueChange: setDays,
          children: _jsxs(TabsList, {
            children: [
              _jsx(TabsTrigger, { value: "7", children: "7d" }),
              _jsx(TabsTrigger, { value: "30", children: "30d" }),
              _jsx(TabsTrigger, { value: "90", children: "90d" }),
            ],
          }),
        }),
      }),
      isLoading
        ? _jsx(Skeleton, { className: "h-96" })
        : !a.total
          ? _jsx(EmptyState, {
              icon: BarChart3,
              title: "No data in this range",
              body: "Add or import notifications to see analytics.",
            })
          : _jsxs("div", {
              className: "grid gap-4 lg:grid-cols-2",
              children: [
                _jsx(Card, {
                  title: "Volume & processing over time",
                  children: _jsx(ResponsiveContainer, {
                    width: "100%",
                    height: 240,
                    children: _jsxs(LineChart, {
                      data: a.volume,
                      children: [
                        _jsx(CartesianGrid, {
                          stroke: "var(--border)",
                          vertical: false,
                        }),
                        _jsx(XAxis, {
                          dataKey: "d",
                          stroke: "var(--muted-foreground)",
                          fontSize: 11,
                          tickLine: false,
                          axisLine: false,
                        }),
                        _jsx(YAxis, {
                          allowDecimals: false,
                          stroke: "var(--muted-foreground)",
                          fontSize: 11,
                          tickLine: false,
                          axisLine: false,
                          width: 24,
                        }),
                        _jsx(Tooltip, { contentStyle: tooltipStyle }),
                        _jsx(Legend, {}),
                        _jsx(Line, {
                          dataKey: "total",
                          name: "Received",
                          stroke: "var(--chart-1)",
                          strokeWidth: 2,
                          dot: false,
                        }),
                        _jsx(Line, {
                          dataKey: "ai",
                          name: "AI analyzed",
                          stroke: "var(--chart-2)",
                          strokeWidth: 2,
                          dot: false,
                        }),
                        _jsx(Line, {
                          dataKey: "fallback",
                          name: "Rule-based",
                          stroke: "var(--chart-4)",
                          strokeWidth: 2,
                          dot: false,
                        }),
                      ],
                    }),
                  }),
                }),
                _jsx(Card, {
                  title: "By platform",
                  children: _jsx(ResponsiveContainer, {
                    width: "100%",
                    height: 240,
                    children: _jsxs(BarChart, {
                      data: a.platform,
                      children: [
                        _jsx(XAxis, {
                          dataKey: "name",
                          stroke: "var(--muted-foreground)",
                          fontSize: 11,
                          tickLine: false,
                          axisLine: false,
                        }),
                        _jsx(YAxis, {
                          allowDecimals: false,
                          stroke: "var(--muted-foreground)",
                          fontSize: 11,
                          width: 24,
                          axisLine: false,
                          tickLine: false,
                        }),
                        _jsx(Tooltip, {
                          contentStyle: tooltipStyle,
                          cursor: { fill: "var(--accent)" },
                        }),
                        _jsx(Bar, {
                          dataKey: "value",
                          name: "Count",
                          fill: "var(--chart-1)",
                          radius: 4,
                        }),
                      ],
                    }),
                  }),
                }),
                _jsx(Card, {
                  title: "By category",
                  children: _jsx(ResponsiveContainer, {
                    width: "100%",
                    height: 240,
                    children: _jsxs(PieChart, {
                      children: [
                        _jsx(Pie, {
                          data: a.category,
                          dataKey: "value",
                          nameKey: "name",
                          innerRadius: 55,
                          outerRadius: 90,
                          stroke: "var(--card)",
                          children: a.category.map((_, i) =>
                            _jsx(Cell, { fill: COLORS[i % COLORS.length] }, i),
                          ),
                        }),
                        _jsx(Tooltip, { contentStyle: tooltipStyle }),
                        _jsx(Legend, {}),
                      ],
                    }),
                  }),
                }),
                _jsx(Card, {
                  title: "Priority distribution",
                  children: _jsx(ResponsiveContainer, {
                    width: "100%",
                    height: 240,
                    children: _jsxs(BarChart, {
                      data: a.priority,
                      children: [
                        _jsx(XAxis, {
                          dataKey: "name",
                          stroke: "var(--muted-foreground)",
                          fontSize: 11,
                          tickLine: false,
                          axisLine: false,
                        }),
                        _jsx(YAxis, {
                          allowDecimals: false,
                          width: 24,
                          stroke: "var(--muted-foreground)",
                          fontSize: 11,
                          axisLine: false,
                          tickLine: false,
                        }),
                        _jsx(Tooltip, {
                          contentStyle: tooltipStyle,
                          cursor: { fill: "var(--accent)" },
                        }),
                        _jsx(Bar, {
                          dataKey: "value",
                          name: "Count",
                          radius: 4,
                          children: a.priority.map((p) =>
                            _jsx(
                              Cell,
                              { fill: PCOL[p.name] ?? "var(--low)" },
                              p.name,
                            ),
                          ),
                        }),
                      ],
                    }),
                  }),
                }),
                _jsx(Card, {
                  title: "Read vs unread",
                  children: _jsx(ResponsiveContainer, {
                    width: "100%",
                    height: 220,
                    children: _jsxs(PieChart, {
                      children: [
                        _jsxs(Pie, {
                          data: a.read,
                          dataKey: "value",
                          nameKey: "name",
                          innerRadius: 50,
                          outerRadius: 85,
                          stroke: "var(--card)",
                          children: [
                            _jsx(Cell, { fill: "var(--chart-3)" }),
                            _jsx(Cell, { fill: "var(--chart-1)" }),
                          ],
                        }),
                        _jsx(Tooltip, { contentStyle: tooltipStyle }),
                        _jsx(Legend, {}),
                      ],
                    }),
                  }),
                }),
                _jsx(Card, {
                  title: "Most frequent senders",
                  children: _jsx(ResponsiveContainer, {
                    width: "100%",
                    height: 220,
                    children: _jsxs(BarChart, {
                      data: a.senders,
                      layout: "vertical",
                      children: [
                        _jsx(XAxis, { type: "number", hide: true }),
                        _jsx(YAxis, {
                          type: "category",
                          dataKey: "name",
                          width: 110,
                          stroke: "var(--muted-foreground)",
                          fontSize: 11,
                          axisLine: false,
                          tickLine: false,
                        }),
                        _jsx(Tooltip, {
                          contentStyle: tooltipStyle,
                          cursor: { fill: "var(--accent)" },
                        }),
                        _jsx(Bar, {
                          dataKey: "value",
                          name: "Count",
                          fill: "var(--chart-2)",
                          radius: 4,
                        }),
                      ],
                    }),
                  }),
                }),
              ],
            }),
    ],
  });
}
