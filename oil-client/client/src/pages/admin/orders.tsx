import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { oliUrl } from "@/lib/oliApi";

type AdminOrderDto = {
  id: string;
  createdAt?: string;
  customerName?: string;
  customerEmail?: string;
  subtotal?: number;
  shipping?: number;
  total?: number;
  status?: string;
  paymentStatus?: string;
  deliveryProvider?: string;
  trackingId?: string;
  trackingUrl?: string;
};

const orderStatuses = ["All", "Pending", "Processing", "Shipped", "Delivered", "Cancelled"];
const deliveryProviders = ["None", "IThink", "Manual"];

export default function AdminOrders() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [preview, setPreview] = useState<{
    title: string;
    url: string;
    allowPrint?: boolean;
  } | null>(null);
  const previewIframeRef = useRef<HTMLIFrameElement | null>(null);

  const { data: orders = [], isLoading, refetch } = useQuery<AdminOrderDto[]>({
    queryKey: [oliUrl("/api/admin/orders")],
    queryFn: async () => {
      const res = await fetch(oliUrl("/api/admin/orders"));
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || json?.error || "Failed to fetch orders");
      return json as AdminOrderDto[];
    },
  });

  const [savingId, setSavingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<Record<string, string>>({});
  const [editDelivery, setEditDelivery] = useState<Record<string, string>>({});
  const [editTrackingId, setEditTrackingId] = useState<Record<string, string>>({});
  const [editTrackingUrl, setEditTrackingUrl] = useState<Record<string, string>>({});

  const saveRow = async (order: AdminOrderDto) => {
    const id = order.id;
    const status = editStatus[id] ?? order.status ?? "Pending";
    const deliveryProviderRaw = editDelivery[id] ?? order.deliveryProvider ?? "";
    const deliveryProvider = deliveryProviderRaw === "None" ? "" : deliveryProviderRaw;
    const trackingId = editTrackingId[id] ?? order.trackingId ?? "";
    const trackingUrl = editTrackingUrl[id] ?? order.trackingUrl ?? "";

    try {
      setSavingId(id);
      const res = await fetch(oliUrl(`/api/admin/orders/${encodeURIComponent(id)}`), {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status,
          deliveryProvider,
          trackingId,
          trackingUrl,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || json?.error || "Failed to update order");
      await refetch();
    } finally {
      setSavingId(null);
    }
  };

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter and sort orders
  const filteredAndSortedOrders = useMemo(() => {
    let filtered = [...orders];

    // Apply status filter
    if (statusFilter !== "All") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Apply search filter
    if (debouncedSearch.trim()) {
      const query = debouncedSearch.trim().toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.id.toLowerCase().includes(query) ||
          order.customerName?.toLowerCase().includes(query) ||
          order.customerEmail?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case "createdAt":
          aValue = new Date(a.createdAt ?? Date.now()).getTime();
          bValue = new Date(b.createdAt ?? Date.now()).getTime();
          break;
        case "total":
          aValue = a.total ?? 0;
          bValue = b.total ?? 0;
          break;
        case "status":
          aValue = a.status || "";
          bValue = b.status || "";
          break;
        case "id":
          aValue = a.id;
          bValue = b.id;
          break;
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    return filtered;
  }, [debouncedSearch, statusFilter, sortBy, sortOrder, orders]);

  const formatDate = (dateString?: string) => {
    try {
      return new Date(dateString ?? Date.now()).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString || "";
    }
  };

  const getStatusBadgeVariant = (status?: string) => {
    switch (status) {
      case "Delivered":
        return "default";
      case "Shipped":
        return "secondary";
      case "Processing":
        return "secondary";
      case "Pending":
        return "outline";
      case "Cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        <p className="text-sm text-muted-foreground">Manage your orders here.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search & Filter Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Search by order ID, name, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {orderStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={sortBy}
              onValueChange={(value) => {
                setSortBy(value);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Created Date</SelectItem>
                <SelectItem value="total">Total Amount</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="id">Order ID</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={sortOrder}
              onValueChange={(value) => {
                setSortOrder(value as "asc" | "desc");
              }}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Descending</SelectItem>
                <SelectItem value="asc">Ascending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Orders ({filteredAndSortedOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="min-w-[1200px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap w-[150px]">Order ID</TableHead>
                  <TableHead className="whitespace-nowrap w-[160px]">Customer</TableHead>
                  <TableHead className="whitespace-nowrap w-[220px]">Email</TableHead>
                  <TableHead className="whitespace-nowrap w-[120px]">Subtotal</TableHead>
                  <TableHead className="whitespace-nowrap w-[120px]">Shipping</TableHead>
                  <TableHead className="whitespace-nowrap w-[120px]">Total</TableHead>
                  <TableHead className="whitespace-nowrap w-[200px]">Status</TableHead>
                  <TableHead className="whitespace-nowrap w-[160px]">Delivery</TableHead>
                  <TableHead className="whitespace-nowrap w-[280px]">Tracking</TableHead>
                  <TableHead className="whitespace-nowrap w-[180px]">Date</TableHead>
                  <TableHead className="whitespace-nowrap text-right w-[280px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center text-muted-foreground">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : filteredAndSortedOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center text-muted-foreground">
                      No orders found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium whitespace-nowrap align-top">{order.id}</TableCell>
                      <TableCell className="whitespace-nowrap align-top">{order.customerName || "-"}</TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap align-top">{order.customerEmail || "-"}</TableCell>
                      <TableCell className="whitespace-nowrap align-top">₹{(order.subtotal ?? 0).toLocaleString()}</TableCell>
                      <TableCell className="whitespace-nowrap align-top">₹{(order.shipping ?? 0).toLocaleString()}</TableCell>
                      <TableCell className="font-semibold whitespace-nowrap align-top">
                        ₹{(order.total ?? 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="space-y-2">
                          <Badge variant={getStatusBadgeVariant(order.status)}>
                            {order.status || "Pending"}
                          </Badge>
                          <Select
                            value={editStatus[order.id] ?? (order.status || "Pending")}
                            onValueChange={(v) => setEditStatus((p) => ({ ...p, [order.id]: v }))}
                          >
                            <SelectTrigger className="h-8 w-[160px]">
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                              {orderStatuses
                                .filter((s) => s !== "All")
                                .map((s) => (
                                  <SelectItem key={s} value={s}>
                                    {s}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <Select
                          value={editDelivery[order.id] ?? (order.deliveryProvider ? String(order.deliveryProvider) : "None")}
                          onValueChange={(v) => setEditDelivery((p) => ({ ...p, [order.id]: v }))}
                        >
                          <SelectTrigger className="h-8 w-[140px]">
                            <SelectValue placeholder="Delivery" />
                          </SelectTrigger>
                          <SelectContent>
                            {deliveryProviders.map((p) => (
                              <SelectItem key={p} value={p}>
                                {p}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="space-y-2 w-[260px]">
                          <Input
                            value={editTrackingId[order.id] ?? order.trackingId ?? ""}
                            onChange={(e) => setEditTrackingId((p) => ({ ...p, [order.id]: e.target.value }))}
                            placeholder="Tracking ID"
                            className="h-8"
                          />
                          <Input
                            value={editTrackingUrl[order.id] ?? order.trackingUrl ?? ""}
                            onChange={(e) => setEditTrackingUrl((p) => ({ ...p, [order.id]: e.target.value }))}
                            placeholder="Tracking URL"
                            className="h-8"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground align-top">
                        {formatDate(order.createdAt)}
                      </TableCell>
                      <TableCell className="text-right align-top">
                        <div className="flex justify-end flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setPreview({
                                title: "Order Details",
                                url: `/account/orders/${encodeURIComponent(order.id)}?embed=1`,
                              })
                            }
                          >
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setPreview({
                                title: "Track Order",
                                url: `/account/orders/${encodeURIComponent(order.id)}/track?embed=1`,
                              })
                            }
                          >
                            Track
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setPreview({
                                title: "Invoice Preview",
                                url: `/account/orders/${encodeURIComponent(order.id)}/invoice`,
                                allowPrint: true,
                              })
                            }
                          >
                            Invoice
                          </Button>
                          <Button
                            className="btn-primary"
                            size="sm"
                            disabled={savingId === order.id}
                            onClick={() => saveRow(order)}
                          >
                            {savingId === order.id ? "Saving…" : "Save"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!preview} onOpenChange={(open) => (!open ? setPreview(null) : undefined)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <DialogTitle>{preview?.title || "Preview"}</DialogTitle>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setPreview(null)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="rounded-md border bg-background overflow-hidden relative">
            {/* Transparent overlay to prevent right-click and some interactions */}
            <div 
              className="pdf-overlay" 
              onContextMenu={(e) => e.preventDefault()}
            />
            {preview?.url ? (
              <iframe
                ref={previewIframeRef}
                title="Preview"
                src={`${preview.url}${preview.url.includes('?') ? '&' : '?'}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                className="w-full h-[70vh] relative z-0"
                style={{ border: 'none' }}
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
