package com.oli.oli.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.oli.oli.controller.IThinkController;
import com.oli.oli.model.OrderEntity;
import com.oli.oli.model.OrderItemEntity;
import com.oli.oli.repository.OrderItemRepository;
import com.oli.oli.repository.OrderRepository;

@Service
public class OrderSyncService {

    private static final Logger log = LoggerFactory.getLogger(OrderSyncService.class);

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final IThinkController iThinkController;

    public OrderSyncService(OrderRepository orderRepository, OrderItemRepository orderItemRepository,
            IThinkController iThinkController) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.iThinkController = iThinkController;
    }

    /**
     * Periodically retries failed IThink bookings.
     * Runs every 15 minutes.
     */
    @Scheduled(fixedRate = 900000) // 15 minutes
    public void retryFailedBookings() {
        log.info("Starting scheduled retry of failed IThink bookings");

        List<OrderEntity> orders = orderRepository.findAll().stream()
                .filter(o -> "IThink".equalsIgnoreCase(o.getDeliveryProvider()))
                .filter(o -> !StringUtils.hasText(o.getTrackingId()))
                // Only retry if it was created more than 5 minutes ago to avoid race conditions with new orders
                .filter(o -> o.getCreatedAt() != null && o.getCreatedAt().isBefore(Instant.now().minus(5, ChronoUnit.MINUTES)))
                // Limit retries to avoid overwhelming API if many fail
                .limit(20)
                .toList();

        if (orders.isEmpty()) {
            return;
        }

        log.info("Found {} orders to retry IThink booking", orders.size());

        for (OrderEntity o : orders) {
            try {
                List<OrderItemEntity> items = orderItemRepository.findByOrder_Id(o.getId());
                var created = iThinkController.createOrder(o, items);
                
                if (created != null && created.success()) {
                    boolean updated = false;
                    if (StringUtils.hasText(created.waybill())) {
                        o.setTrackingId(created.waybill().trim());
                        updated = true;
                    }
                    if (StringUtils.hasText(created.trackingUrl())) {
                        o.setTrackingUrl(created.trackingUrl().trim());
                        updated = true;
                    }
                    
                    if (updated) {
                        log.info("Successfully synced tracking for orderId={} waybill={}", o.getId(), created.waybill());
                        orderRepository.save(o);
                    } else if (!StringUtils.hasText(o.getTrackingUrl())) {
                        o.setTrackingUrl("Order Created on Portal (Manual Booking Required)");
                        orderRepository.save(o);
                    }
                } else {
                    String errorMsg = (created != null && StringUtils.hasText(created.message())) 
                        ? created.message().trim() 
                        : "Logistics provider error";
                    
                    String fullError = "Automatic Booking Failed: " + errorMsg;
                    if (!fullError.equals(o.getTrackingUrl())) {
                        o.setTrackingUrl(fullError);
                        orderRepository.save(o);
                    }
                    log.warn("Retry failed for orderId={}: {}", o.getId(), errorMsg);
                }
            } catch (Exception ex) {
                log.error("Error during scheduled retry for orderId={}", o.getId(), ex);
            }
        }
    }
}
