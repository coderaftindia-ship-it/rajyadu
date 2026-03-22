package com.oli.oli.controller;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Locale;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.oli.oli.model.OrderEntity;
import com.oli.oli.model.OrderItemEntity;
import com.oli.oli.repository.OrderItemRepository;
import com.oli.oli.repository.OrderRepository;
import com.oli.oli.repository.UserRepository;

@RestController
@RequestMapping("/api/admin/reports")
public class ReportsController {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;

    public ReportsController(OrderRepository orderRepository, OrderItemRepository orderItemRepository, UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/overview")
    public Map<String, Object> overview(@RequestParam(value = "months", defaultValue = "12") int months) {
        int m = Math.max(1, Math.min(months, 60));

        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        YearMonth current = YearMonth.from(today);
        YearMonth startMonth = current.minusMonths(m - 1L);
        Instant startInstant = startMonth.atDay(1).atStartOfDay().toInstant(ZoneOffset.UTC);

        List<OrderEntity> orders = orderRepository.findAll().stream()
                .filter(o -> o != null && o.getCreatedAt() != null)
                .filter(o -> !o.getCreatedAt().isBefore(startInstant))
                .collect(Collectors.toList());

        Map<YearMonth, BigDecimal> revenueByMonth = orders.stream()
                .filter(o -> isPaid(o.getPaymentStatus()))
                .collect(Collectors.groupingBy(
                        o -> YearMonth.from(LocalDate.ofInstant(o.getCreatedAt(), ZoneOffset.UTC)),
                        Collectors.mapping(
                                o -> o.getTotal() == null ? BigDecimal.ZERO : o.getTotal(),
                                Collectors.reducing(BigDecimal.ZERO, BigDecimal::add))));

        Map<YearMonth, Long> paidOrdersByMonth = orders.stream()
                .filter(o -> isPaid(o.getPaymentStatus()))
                .collect(Collectors.groupingBy(
                        o -> YearMonth.from(LocalDate.ofInstant(o.getCreatedAt(), ZoneOffset.UTC)),
                        Collectors.counting()));

        Instant startForUsers = startInstant;
        Map<YearMonth, Long> newCustomersByMonth = userRepository.findAll().stream()
                .filter(u -> u != null && u.getCreatedAt() != null)
                .filter(u -> !u.getCreatedAt().isBefore(startForUsers))
                .collect(Collectors.groupingBy(
                        u -> YearMonth.from(LocalDate.ofInstant(u.getCreatedAt(), ZoneOffset.UTC)),
                        Collectors.counting()));

        List<Map<String, Object>> monthsList = new java.util.ArrayList<>();
        BigDecimal totalRevenue = BigDecimal.ZERO;
        long totalPaidOrders = 0;
        long totalNewCustomers = 0;

        for (int i = 0; i < m; i++) {
            YearMonth ym = startMonth.plusMonths(i);
            BigDecimal revenue = revenueByMonth.getOrDefault(ym, BigDecimal.ZERO);
            long paidOrders = paidOrdersByMonth.getOrDefault(ym, 0L);
            long newCustomers = newCustomersByMonth.getOrDefault(ym, 0L);

            totalRevenue = totalRevenue.add(revenue);
            totalPaidOrders += paidOrders;
            totalNewCustomers += newCustomers;

            Map<String, Object> row = new HashMap<>();
            row.put("month", ym.toString()); // YYYY-MM
            row.put("revenue", revenue);
            row.put("paidOrders", paidOrders);
            row.put("newCustomers", newCustomers);
            monthsList.add(row);
        }

        Map<String, Object> totals = new HashMap<>();
        totals.put("revenue", totalRevenue);
        totals.put("paidOrders", totalPaidOrders);
        totals.put("newCustomers", totalNewCustomers);

        Map<String, Object> resp = new HashMap<>();
        resp.put("months", monthsList);
        resp.put("totals", totals);
        resp.put("range", Map.of("months", m, "from", startMonth.toString(), "to", current.toString()));
        return resp;
    }

    @GetMapping("/top-products")
    public Map<String, Object> topProducts(
            @RequestParam(value = "months", defaultValue = "3") int months,
            @RequestParam(value = "limit", defaultValue = "10") int limit) {

        int m = Math.max(1, Math.min(months, 60));
        int l = Math.max(1, Math.min(limit, 50));

        Instant start = Instant.now().minus(m * 31L, ChronoUnit.DAYS);

        // Build a paid order id set for filtering order_items.
        Map<String, OrderEntity> paidOrders = orderRepository.findAll().stream()
                .filter(o -> o != null && o.getId() != null)
                .filter(o -> o.getCreatedAt() != null && !o.getCreatedAt().isBefore(start))
                .filter(o -> isPaid(o.getPaymentStatus()))
                .collect(Collectors.toMap(OrderEntity::getId, o -> o, (a, b) -> a));

        Map<String, ProductAgg> agg = new LinkedHashMap<>();

        for (OrderItemEntity it : orderItemRepository.findAll()) {
            if (it == null || it.getOrder() == null || it.getOrder().getId() == null) {
                continue;
            }
            if (!paidOrders.containsKey(it.getOrder().getId())) {
                continue;
            }

            String key = (it.getProductId() == null ? "" : String.valueOf(it.getProductId())) + "|" + safe(it.getProductName());
            ProductAgg a = agg.get(key);
            if (a == null) {
                a = new ProductAgg(it.getProductId(), it.getProductName());
                agg.put(key, a);
            }

            int qty = it.getQuantity() == null ? 0 : it.getQuantity();
            BigDecimal unit = it.getUnitPrice() == null ? BigDecimal.ZERO : it.getUnitPrice();
            a.quantity += qty;
            a.revenue = a.revenue.add(unit.multiply(new BigDecimal(qty)));
        }

        List<Map<String, Object>> products = agg.values().stream()
                .sorted(Comparator.comparing((ProductAgg a) -> a.revenue).reversed())
                .limit(l)
                .map(a -> {
                    Map<String, Object> m1 = new HashMap<>();
                    m1.put("productId", a.productId);
                    m1.put("name", a.name);
                    m1.put("quantity", a.quantity);
                    m1.put("revenue", a.revenue);
                    return m1;
                })
                .collect(Collectors.toList());

        return Map.of(
                "months", m,
                "limit", l,
                "products", products);
    }

    @GetMapping("/orders-breakdown")
    public Map<String, Object> ordersBreakdown(@RequestParam(value = "months", defaultValue = "12") int months) {
        int m = Math.max(1, Math.min(months, 60));

        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        YearMonth current = YearMonth.from(today);
        YearMonth startMonth = current.minusMonths(m - 1L);
        Instant startInstant = startMonth.atDay(1).atStartOfDay().toInstant(ZoneOffset.UTC);

        List<OrderEntity> orders = orderRepository.findAll().stream()
                .filter(o -> o != null && o.getCreatedAt() != null)
                .filter(o -> !o.getCreatedAt().isBefore(startInstant))
                .collect(Collectors.toList());

        Map<YearMonth, Long> pendingByMonth = new HashMap<>();
        Map<YearMonth, Long> processingByMonth = new HashMap<>();
        Map<YearMonth, Long> shippedByMonth = new HashMap<>();
        Map<YearMonth, Long> deliveredByMonth = new HashMap<>();
        Map<YearMonth, Long> cancelledByMonth = new HashMap<>();

        Map<YearMonth, Long> ithinkByMonth = new HashMap<>();
        Map<YearMonth, Long> manualByMonth = new HashMap<>();
        Map<YearMonth, Long> otherDeliveryByMonth = new HashMap<>();

        for (OrderEntity o : orders) {
            YearMonth ym = YearMonth.from(LocalDate.ofInstant(o.getCreatedAt(), ZoneOffset.UTC));

            String st = normalize(o.getStatus());
            if (st.equals("pending") || st.equals("pending fulfillment") || st.equals("pending_fulfillment")) {
                pendingByMonth.merge(ym, 1L, Long::sum);
            } else if (st.equals("processing")) {
                processingByMonth.merge(ym, 1L, Long::sum);
            } else if (st.equals("shipped")) {
                shippedByMonth.merge(ym, 1L, Long::sum);
            } else if (st.equals("delivered")) {
                deliveredByMonth.merge(ym, 1L, Long::sum);
            } else if (st.equals("cancelled") || st.equals("canceled")) {
                cancelledByMonth.merge(ym, 1L, Long::sum);
            } else {
                pendingByMonth.merge(ym, 1L, Long::sum);
            }

            String dp = normalize(o.getDeliveryProvider());
            if (dp.equals("ithink")) {
                ithinkByMonth.merge(ym, 1L, Long::sum);
            } else if (dp.isBlank() || dp.equals("manual") || dp.equals("none")) {
                manualByMonth.merge(ym, 1L, Long::sum);
            } else {
                otherDeliveryByMonth.merge(ym, 1L, Long::sum);
            }
        }

        List<Map<String, Object>> monthsList = new java.util.ArrayList<>();
        for (int i = 0; i < m; i++) {
            YearMonth ym = startMonth.plusMonths(i);
            Map<String, Object> row = new HashMap<>();
            row.put("month", ym.toString());

            row.put("pending", pendingByMonth.getOrDefault(ym, 0L));
            row.put("processing", processingByMonth.getOrDefault(ym, 0L));
            row.put("shipped", shippedByMonth.getOrDefault(ym, 0L));
            row.put("delivered", deliveredByMonth.getOrDefault(ym, 0L));
            row.put("cancelled", cancelledByMonth.getOrDefault(ym, 0L));

            row.put("ithink", ithinkByMonth.getOrDefault(ym, 0L));
            row.put("manual", manualByMonth.getOrDefault(ym, 0L));
            row.put("otherDelivery", otherDeliveryByMonth.getOrDefault(ym, 0L));

            monthsList.add(row);
        }

        Map<String, Object> resp = new HashMap<>();
        resp.put("months", monthsList);
        resp.put("range", Map.of("months", m, "from", startMonth.toString(), "to", current.toString()));
        return resp;
    }

    private static String safe(String v) {
        return v == null ? "" : v;
    }

    private static String normalize(String v) {
        if (v == null) {
            return "";
        }
        return v.trim().toLowerCase(Locale.ROOT);
    }

    private static boolean isPaid(String paymentStatus) {
        if (paymentStatus == null) {
            return false;
        }
        String v = paymentStatus.trim().toLowerCase();
        return v.equals("paid") || v.equals("success") || v.equals("completed") || v.equals("captured");
    }

    private static final class ProductAgg {
        final Long productId;
        final String name;
        int quantity;
        BigDecimal revenue;

        ProductAgg(Long productId, String name) {
            this.productId = productId;
            this.name = name;
            this.quantity = 0;
            this.revenue = BigDecimal.ZERO;
        }
    }
}
