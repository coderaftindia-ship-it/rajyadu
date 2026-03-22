package com.oli.oli.controller;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.oli.oli.repository.ProductRepository;
import com.oli.oli.repository.OrderRepository;
import com.oli.oli.repository.UserRepository;

@RestController
@RequestMapping("/api/admin/dashboard")
public class DashboardController {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    public DashboardController(ProductRepository productRepository, UserRepository userRepository, OrderRepository orderRepository) {
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
    }

    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        Instant oneMonthAgo = Instant.now().minus(30, ChronoUnit.DAYS);

        // Count total products
        long totalProducts = productRepository.count();
        long activeProducts = productRepository.count(); // Assuming all products are active, adjust if you have status field

        // Count total users/customers
        long totalCustomers = userRepository.count();
        long newCustomersThisMonth = userRepository.findAll().stream()
                .filter(user -> user.getCreatedAt() != null && user.getCreatedAt().isAfter(oneMonthAgo))
                .count();

        List<com.oli.oli.model.OrderEntity> orders = orderRepository.findAll();

        BigDecimal revenue = orders.stream()
                .filter(o -> o != null && o.getCreatedAt() != null && o.getCreatedAt().isAfter(oneMonthAgo))
                .filter(o -> isPaid(o.getPaymentStatus()))
                .map(o -> o.getTotal() == null ? BigDecimal.ZERO : o.getTotal())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long pendingOrders = orders.stream()
                .filter(o -> o != null)
                .filter(o -> isPending(o.getStatus()))
                .count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("revenue", revenue);
        stats.put("pendingOrders", pendingOrders);
        stats.put("activeProducts", activeProducts);
        stats.put("newCustomers", newCustomersThisMonth);
        stats.put("totalProducts", totalProducts);
        stats.put("totalCustomers", totalCustomers);

        return stats;
    }

    @GetMapping("/recent-orders")
    public Map<String, Object> getRecentOrders() {
        List<Map<String, Object>> orders = orderRepository.findAll().stream()
                .filter(o -> o != null)
                .sorted(Comparator.comparing(com.oli.oli.model.OrderEntity::getCreatedAt,
                        Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .limit(10)
                .map(o -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", o.getId());
                    m.put("createdAt", o.getCreatedAt());
                    m.put("total", o.getTotal() == null ? BigDecimal.ZERO : o.getTotal());
                    m.put("status", o.getStatus() == null ? "" : o.getStatus());
                    m.put("customerName", o.getCustomerName());
                    return m;
                })
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("orders", orders);
        return response;
    }

    @GetMapping("/sales-chart")
    public Map<String, Object> getSalesChart() {
        Instant start = Instant.now().minus(6, ChronoUnit.DAYS);

        Map<LocalDate, BigDecimal> totalsByDay = orderRepository.findAll().stream()
                .filter(o -> o != null && o.getCreatedAt() != null)
                .filter(o -> !o.getCreatedAt().isBefore(start))
                .filter(o -> isPaid(o.getPaymentStatus()))
                .collect(Collectors.groupingBy(
                        o -> LocalDate.ofInstant(o.getCreatedAt(), ZoneOffset.UTC),
                        Collectors.mapping(
                                o -> o.getTotal() == null ? BigDecimal.ZERO : o.getTotal(),
                                Collectors.reducing(BigDecimal.ZERO, BigDecimal::add))));

        Map<String, Object> chartData = new HashMap<>();
        java.util.List<Map<String, Object>> data = new java.util.ArrayList<>();
        
        for (int i = 6; i >= 0; i--) {
            Instant date = Instant.now().minus(i, ChronoUnit.DAYS);
            LocalDate day = LocalDate.ofInstant(date, ZoneOffset.UTC);
            Map<String, Object> dayData = new HashMap<>();
            dayData.put("date", day.toString());
            BigDecimal sales = totalsByDay.getOrDefault(day, BigDecimal.ZERO);
            dayData.put("sales", sales);
            data.add(dayData);
        }
        
        chartData.put("data", data);
        return chartData;
    }

    private static boolean isPaid(String paymentStatus) {
        if (paymentStatus == null) {
            return false;
        }
        String v = paymentStatus.trim().toLowerCase();
        return v.equals("paid") || v.equals("success") || v.equals("completed") || v.equals("captured");
    }

    private static boolean isPending(String status) {
        if (status == null) {
            return true;
        }
        String v = status.trim().toLowerCase();
        return v.isBlank() || v.equals("pending") || v.equals("pending fulfillment") || v.equals("pending_fulfillment");
    }

    @GetMapping("/product-stats")
    public Map<String, Object> getProductStats() {
        long totalProducts = productRepository.count();
        long inStockProducts = productRepository.findAll().stream()
                .filter(p -> p.isInStock())
                .count();
        long outOfStockProducts = totalProducts - inStockProducts;

        Map<String, Object> stats = new HashMap<>();
        stats.put("total", totalProducts);
        stats.put("inStock", inStockProducts);
        stats.put("outOfStock", outOfStockProducts);
        
        return stats;
    }

    @GetMapping("/inventory")
    public Map<String, Object> getInventory() {
        List<Map<String, Object>> products = productRepository.findAll().stream()
                .sorted(Comparator.comparing(com.oli.oli.model.Product::getName,
                        Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
                .map(p -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", p.getId());
                    m.put("name", p.getName());
                    m.put("inStock", p.isInStock());
                    return m;
                })
                .collect(Collectors.toList());

        long outOfStockCount = products.stream()
                .filter(x -> x != null)
                .filter(x -> Boolean.FALSE.equals(x.get("inStock")))
                .count();

        Map<String, Object> resp = new HashMap<>();
        resp.put("outOfStockCount", outOfStockCount);
        resp.put("products", products);
        return resp;
    }
}

