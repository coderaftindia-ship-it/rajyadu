import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import { oliGetJson, oliUrl } from "@/lib/oliApi";

type ReportsOverviewResponse = {
  months: Array<{
    month: string;
    revenue: number;
    paidOrders: number;
    newCustomers: number;
  }>;
  totals: {
    revenue: number;
    paidOrders: number;
    newCustomers: number;
  };
  range: {
    months: number;
    from: string;
    to: string;
  };
};

type TopProductsResponse = {
  months: number;
  limit: number;
  products: Array<{
    productId: number | null;
    name: string;
    quantity: number;
    revenue: number;
  }>;
};

type OrdersBreakdownResponse = {
  months: Array<{
    month: string;
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    ithink: number;
    manual: number;
    otherDelivery: number;
  }>;
  range: {
    months: number;
    from: string;
    to: string;
  };
};

export default function AdminReports() {
  const [months, setMonths] = useState("12");

  const monthsInt = useMemo(() => {
    const n = parseInt(months, 10);
    return Number.isFinite(n) ? n : 12;
  }, [months]);

  const { data: overview, isLoading: overviewLoading } = useQuery<ReportsOverviewResponse>({
    queryKey: [oliUrl(`/api/admin/reports/overview?months=${monthsInt}`)],
    queryFn: async () => {
      return await oliGetJson<ReportsOverviewResponse>(`/api/admin/reports/overview?months=${monthsInt}`);
    },
  });

  const { data: topProducts, isLoading: topProductsLoading } = useQuery<TopProductsResponse>({
    queryKey: [oliUrl(`/api/admin/reports/top-products?months=${Math.min(monthsInt, 12)}&limit=10`)],
    queryFn: async () => {
      return await oliGetJson<TopProductsResponse>(
        `/api/admin/reports/top-products?months=${Math.min(monthsInt, 12)}&limit=10`
      );
    },
  });

  const { data: breakdown, isLoading: breakdownLoading } = useQuery<OrdersBreakdownResponse>({
    queryKey: [oliUrl(`/api/admin/reports/orders-breakdown?months=${monthsInt}`)],
    queryFn: async () => {
      return await oliGetJson<OrdersBreakdownResponse>(`/api/admin/reports/orders-breakdown?months=${monthsInt}`);
    },
  });

  const formatCurrency = (amount: number) => {
    return `₹${(amount || 0).toLocaleString()}`;
  };

  const toCsv = (rows: Array<Record<string, unknown>>) => {
    if (!rows || rows.length === 0) return "";
    const headers = Array.from(
      rows.reduce((s, r) => {
        Object.keys(r || {}).forEach((k) => s.add(k));
        return s;
      }, new Set<string>())
    );

    const esc = (v: unknown) => {
      const s = v == null ? "" : String(v);
      if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    const lines = [headers.join(",")];
    for (const row of rows) {
      const line = headers.map((h) => esc((row as any)?.[h])).join(",");
      lines.push(line);
    }
    return lines.join("\n");
  };

  const downloadCsv = (rows: Array<Record<string, unknown>>, filename: string) => {
    const csv = toCsv(rows);
    if (!csv) return;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const chartConfig = {
    revenue: { label: "Revenue", color: "hsl(var(--chart-1))" },
    paidOrders: { label: "Paid Orders", color: "hsl(var(--chart-2))" },
    newCustomers: { label: "New Customers", color: "hsl(var(--chart-3))" },
    pending: { label: "Pending", color: "hsl(var(--chart-1))" },
    processing: { label: "Processing", color: "hsl(var(--chart-2))" },
    shipped: { label: "Shipped", color: "hsl(var(--chart-3))" },
    delivered: { label: "Delivered", color: "hsl(var(--chart-4))" },
    cancelled: { label: "Cancelled", color: "hsl(var(--chart-5))" },
    ithink: { label: "IThink", color: "hsl(var(--chart-1))" },
    manual: { label: "Manual", color: "hsl(var(--chart-2))" },
    otherDelivery: { label: "Other", color: "hsl(var(--chart-3))" },
  };

  const chartRows = overview?.months ?? [];
  const xLabel = (ym: string) => {
    const [y, m] = String(ym || "").split("-");
    if (!y || !m) return ym;
    return `${m}/${y.slice(-2)}`;
  };

  const revenueChartData = chartRows.map((r) => ({
    month: xLabel(r.month),
    revenue: r.revenue,
  }));

  const ordersCustomersChartData = chartRows.map((r) => ({
    month: xLabel(r.month),
    paidOrders: r.paidOrders,
    newCustomers: r.newCustomers,
  }));

  const breakdownRows = breakdown?.months ?? [];
  const statusChartData = breakdownRows.map((r) => ({
    month: xLabel(r.month),
    pending: r.pending,
    processing: r.processing,
    shipped: r.shipped,
    delivered: r.delivered,
    cancelled: r.cancelled,
  }));

  const deliveryChartData = breakdownRows.map((r) => ({
    month: xLabel(r.month),
    ithink: r.ithink,
    manual: r.manual,
    otherDelivery: r.otherDelivery,
  }));

  const rangeTag = `last-${monthsInt}-months`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">Month-wise analytics and insights.</p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={months} onValueChange={setMonths}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Last 3 months</SelectItem>
              <SelectItem value="6">Last 6 months</SelectItem>
              <SelectItem value="12">Last 12 months</SelectItem>
              <SelectItem value="24">Last 24 months</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => window.location.reload()}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {overviewLoading ? "Loading..." : formatCurrency(overview?.totals?.revenue || 0)}
            </div>
            <div className="text-xs text-muted-foreground">Selected range</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Paid Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {overviewLoading ? "Loading..." : (overview?.totals?.paidOrders || 0).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Selected range</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">New Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {overviewLoading ? "Loading..." : (overview?.totals?.newCustomers || 0).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Selected range</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
            <CardTitle>Revenue by Month</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                downloadCsv(
                  revenueChartData.map((r) => ({ ...r })),
                  `reports-revenue-by-month-${rangeTag}.csv`
                )
              }
              disabled={overviewLoading || revenueChartData.length === 0}
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <div className="h-[260px] flex items-center justify-center text-muted-foreground">Loading chart...</div>
            ) : revenueChartData.length > 0 ? (
              <ChartContainer config={chartConfig}>
                <BarChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-muted-foreground">No data</div>
            )}
          </CardContent>
        </Card>
<Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
            <CardTitle>Order Status (Monthly)</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                downloadCsv(
                  statusChartData.map((r) => ({ ...r })),
                  `reports-order-status-monthly-${rangeTag}.csv`
                )
              }
              disabled={breakdownLoading || statusChartData.length === 0}
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </CardHeader>
          <CardContent>
            {breakdownLoading ? (
              <div className="h-[260px] flex items-center justify-center text-muted-foreground">Loading chart...</div>
            ) : statusChartData.length > 0 ? (
              <ChartContainer config={chartConfig}>
                <BarChart data={statusChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="pending" stackId="a" fill="var(--color-pending)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="processing" stackId="a" fill="var(--color-processing)" />
                  <Bar dataKey="shipped" stackId="a" fill="var(--color-shipped)" />
                  <Bar dataKey="delivered" stackId="a" fill="var(--color-delivered)" />
                  <Bar dataKey="cancelled" stackId="a" fill="var(--color-cancelled)" />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-muted-foreground">No data</div>
            )}
          </CardContent>
        </Card>

      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
            <CardTitle>Delivery Provider (Monthly)</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                downloadCsv(
                  deliveryChartData.map((r) => ({ ...r })),
                  `reports-delivery-provider-monthly-${rangeTag}.csv`
                )
              }
              disabled={breakdownLoading || deliveryChartData.length === 0}
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </CardHeader>
          <CardContent>
            {breakdownLoading ? (
              <div className="h-[260px] flex items-center justify-center text-muted-foreground">Loading chart...</div>
            ) : deliveryChartData.length > 0 ? (
              <ChartContainer config={chartConfig}>
                <BarChart data={deliveryChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="ithink" stackId="b" fill="var(--color-ithink)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="manual" stackId="b" fill="var(--color-manual)" />
                  <Bar dataKey="otherDelivery" stackId="b" fill="var(--color-otherDelivery)" />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-muted-foreground">No data</div>
            )}
          </CardContent>
        </Card>
         <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle>Top Products</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              downloadCsv(
                (topProducts?.products ?? []).map((p) => ({
                  productId: p.productId,
                  name: p.name,
                  quantity: p.quantity,
                  revenue: p.revenue,
                })),
                `reports-top-products-${rangeTag}.csv`
              )
            }
            disabled={topProductsLoading || (topProducts?.products?.length ?? 0) === 0}
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
        </CardHeader>
        <CardContent>
          {topProductsLoading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : topProducts?.products && topProducts.products.length > 0 ? (
            <div className="space-y-2">
              {topProducts.products.map((p, idx) => (
                <div key={`${p.productId ?? "na"}-${idx}`} className="flex items-center justify-between border-b pb-2 text-sm">
                  <div className="min-w-0 pr-3">
                    <div className="font-medium truncate">{p.name || "(Unnamed)"}</div>
                    <div className="text-xs text-muted-foreground">Qty: {(p.quantity || 0).toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(p.revenue || 0)}</div>
                    <div className="text-xs text-muted-foreground">Last {topProducts.months} months</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No data</div>
          )}
        </CardContent>
      </Card>
      </div>

     
    </div>
  );
}
