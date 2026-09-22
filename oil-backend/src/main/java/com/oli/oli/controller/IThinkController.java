package com.oli.oli.controller;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.util.MultiValueMap;
import org.springframework.web.util.UriComponentsBuilder;

import com.oli.oli.model.OrderEntity;
import com.oli.oli.model.OrderItemEntity;

@RestController
@RequestMapping("/api/ithink")
public class IThinkController {

    private static final Logger log = LoggerFactory.getLogger(IThinkController.class);

    private final RestTemplate restTemplate;

    @Value("${logistic.api.key}")
    private String accessToken;

    @Value("${logistic.api.secret}")
    private String secretKey;

    @Value("${logistic.api.base-url:https://my.ithinklogistics.com}")
    private String baseUrl;

    @Value("${logistic.api.order-base-url:}")
    private String orderBaseUrl;

    @Value("${logistic.pickup.pincode:302002}")
    private String pickupPincode;

    @Value("${logistic.pickup.address-id:24}")
    private String pickupAddressId;

    @Value("${logistic.return.address-id:24}")
    private String returnAddressId;

    @Value("${logistic.default.logistics:delhivery}")
    private String defaultLogistics;

    @Value("${logistic.default.service-type:ground}")
    private String defaultServiceType;

    // Optional proxy: if set, /api/ithink/serviceability will forward to this
    // upstream
    // Example: http://localshot:8085
    @Value("${ithink.serviceability.proxy-base-url:}")
    private String serviceabilityProxyBaseUrl;

    public IThinkController(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public CreateOrderResponse createOrder(OrderEntity order, List<OrderItemEntity> items) {
        if (order == null) {
            return new CreateOrderResponse(false, null, null, null, "Order is required", null);
        }
        if (order.getShippingPincode() == null || order.getShippingPincode().isBlank()) {
            return new CreateOrderResponse(false, null, null, null, "Shipping pincode is required", null);
        }

        String apiBase = (orderBaseUrl == null || orderBaseUrl.isBlank()) ? baseUrl : orderBaseUrl;
        String url = normalizeBaseUrl(apiBase) + "/api_v3/order/add.json";

        String cleanPhone = formatPhoneNumber(order.getCustomerPhone());

        Map<String, Object> shipment = new HashMap<>();
        shipment.put("waybill", "");
        shipment.put("order", order.getId());
        shipment.put("sub_order", "");
        shipment.put("order_date",
                java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("dd-MM-yyyy")));
        shipment.put("total_amount", order.getTotal() == null ? "0" : order.getTotal().toPlainString());
        shipment.put("name", order.getCustomerName() == null ? "" : order.getCustomerName().trim());
        shipment.put("company_name", "");
        shipment.put("add", order.getShippingAddress() == null ? "" : order.getShippingAddress().trim());
        shipment.put("add2", "");
        shipment.put("add3", "");
        shipment.put("pin", order.getShippingPincode().trim());
        shipment.put("city", order.getShippingCity() == null ? "" : order.getShippingCity().trim());
        shipment.put("state", order.getShippingState() == null ? "" : order.getShippingState().trim());
        shipment.put("country", "India");
        shipment.put("phone", cleanPhone);
        shipment.put("alt_phone", "");
        shipment.put("email", order.getCustomerEmail() == null ? "" : order.getCustomerEmail().trim());

        shipment.put("is_billing_same_as_shipping", "yes");
        shipment.put("billing_name", order.getCustomerName() == null ? "" : order.getCustomerName().trim());
        shipment.put("billing_company_name", "");
        shipment.put("billing_add", order.getShippingAddress() == null ? "" : order.getShippingAddress().trim());
        shipment.put("billing_add2", "");
        shipment.put("billing_add3", "");
        shipment.put("billing_pin", order.getShippingPincode().trim());
        shipment.put("billing_city", order.getShippingCity() == null ? "" : order.getShippingCity().trim());
        shipment.put("billing_state", order.getShippingState() == null ? "" : order.getShippingState().trim());
        shipment.put("billing_country", "India");
        shipment.put("billing_phone", cleanPhone);
        shipment.put("billing_alt_phone", "");
        shipment.put("billing_email", order.getCustomerEmail() == null ? "" : order.getCustomerEmail().trim());

        BigDecimal productsSum = BigDecimal.ZERO;
        List<Map<String, Object>> products = new java.util.ArrayList<>();
        if (items != null) {
            for (OrderItemEntity it : items) {
                if (it == null)
                    continue;
                Map<String, Object> p = new HashMap<>();
                p.put("product_name", it.getProductName() == null ? "Product" : it.getProductName());
                p.put("product_sku", it.getProductId() == null ? "SKU1" : String.valueOf(it.getProductId()));
                int itemQty = it.getQuantity() == null ? 1 : it.getQuantity();
                BigDecimal itemPrice = it.getUnitPrice() == null ? BigDecimal.ZERO : it.getUnitPrice();
                p.put("product_quantity", String.valueOf(itemQty));
                p.put("product_price", itemPrice.toPlainString());
                p.put("product_tax_rate", "0");
                p.put("product_hsn_code", "");
                p.put("product_discount", "0");
                p.put("product_img_url", "");
                products.add(p);
                productsSum = productsSum.add(itemPrice.multiply(BigDecimal.valueOf(itemQty)));
            }
        }
        shipment.put("products", products);

        shipment.put("shipment_length", "10");
        shipment.put("shipment_width", "10");
        shipment.put("shipment_height", "10");

        int qty = items == null ? 0
                : items.stream().filter(Objects::nonNull).mapToInt(x -> x.getQuantity() == null ? 0 : x.getQuantity())
                        .sum();
        BigDecimal weightGm = BigDecimal.valueOf(Math.max(400, qty * 500));
        BigDecimal weightKg = weightGm.divide(new BigDecimal("1000"), 3, java.math.RoundingMode.UP);
        shipment.put("weight", weightKg.stripTrailingZeros().toPlainString());

        BigDecimal totalAmount = order.getTotal() == null ? BigDecimal.ZERO : order.getTotal();
        BigDecimal shippingCharges = order.getShipping() == null ? BigDecimal.ZERO : order.getShipping();

        BigDecimal calculatedSum = productsSum.add(shippingCharges);
        BigDecimal totalDiscount = BigDecimal.ZERO;

        if (calculatedSum.compareTo(totalAmount) > 0) {
            totalDiscount = calculatedSum.subtract(totalAmount);
        } else if (calculatedSum.compareTo(totalAmount) < 0) {
            shippingCharges = totalAmount.subtract(productsSum);
            if (shippingCharges.compareTo(BigDecimal.ZERO) < 0) {
                shippingCharges = BigDecimal.ZERO;
            }
        }

        shipment.put("total_amount", totalAmount.toPlainString());
        shipment.put("shipping_charges", shippingCharges.toPlainString());
        shipment.put("giftwrap_charges", "0");
        shipment.put("transaction_charges", "0");
        shipment.put("total_discount", totalDiscount.toPlainString());
        shipment.put("first_attemp_discount", "0");

        boolean cod = order.getPaymentMethod() != null && order.getPaymentMethod().trim().equalsIgnoreCase("cod");
        shipment.put("cod_amount", cod ? totalAmount.toPlainString() : "0");
        shipment.put("payment_mode", cod ? "COD" : "Prepaid");

        shipment.put("reseller_name", "");
        shipment.put("eway_bill_number", "");
        shipment.put("gst_number", "");
        shipment.put("what3words", "");
        shipment.put("return_address_id", returnAddressId);

        Map<String, Object> data = new HashMap<>();
        data.put("shipments", List.of(shipment));
        data.put("pickup_address_id", pickupAddressId);
        data.put("access_token", accessToken);
        data.put("secret_key", secretKey);
        data.put("logistics", defaultLogistics == null ? "" : defaultLogistics);
        data.put("s_type", defaultServiceType == null ? "" : defaultServiceType);
        data.put("order_type", "");

        Map<String, Object> payload = Map.of("data", data);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        try {
            log.info(
                    "IThink createOrder request orderId={} pickupAddressId={} returnAddressId={} logistics={} s_type={} paymentMode={} weight={} url={}",
                    order.getId(), pickupAddressId, returnAddressId, defaultLogistics, defaultServiceType,
                    shipment.get("payment_mode"), shipment.get("weight"), url);
            ResponseEntity<Map> resp = restTemplate.postForEntity(url, new HttpEntity<>(payload, headers), Map.class);
            Map body = resp.getBody();
            if (body == null) {
                return new CreateOrderResponse(false, null, null, null, "Empty response from logistics provider", null);
            }

            log.info("IThink createOrder raw response for orderId={}: {}", order.getId(), body);
            var res = parseCreateOrderResponse(order.getId(), body);

            // If specific logistics failed (e.g. delhivery not serviceable), retry with auto logistics (empty string)
            if (!res.success() && defaultLogistics != null && !defaultLogistics.isBlank()) {
                log.info("Retrying IThink createOrder with auto-logistics for orderId={}", order.getId());
                data.put("logistics", "");
                payload = Map.of("data", data);
                try {
                    ResponseEntity<Map> resp2 = restTemplate.postForEntity(url, new HttpEntity<>(payload, headers), Map.class);
                    Map body2 = resp2.getBody();
                    if (body2 != null) {
                        var res2 = parseCreateOrderResponse(order.getId(), body2);
                        if (res2.success()) {
                            log.info("IThink auto-logistics retry succeeded for orderId={}", order.getId());
                            return res2;
                        }
                    }
                } catch (Exception ex2) {
                    log.warn("IThink auto-logistics retry error for orderId={}", order.getId(), ex2);
                }
            }

            return res;
        } catch (RestClientException ex) {
            log.error("IThink createOrder error orderId={}", order.getId(), ex);
            return new CreateOrderResponse(false, null, null, null, "Failed to connect to logistics provider: " + ex.getMessage(), ex.getMessage());
        }
    }

    private static String formatPhoneNumber(String phone) {
        if (phone == null) return "";
        String cleaned = phone.replaceAll("[^0-9]", "");
        if (cleaned.length() > 10 && (cleaned.startsWith("91") || cleaned.startsWith("0"))) {
            cleaned = cleaned.substring(cleaned.length() - 10);
        }
        return cleaned;
    }

    private CreateOrderResponse parseCreateOrderResponse(String orderId, Map body) {
        if (body == null) {
            return new CreateOrderResponse(false, null, null, null, "Empty response from logistics provider", null);
        }

        Object statusObj = body.get("status");
        Object statusCodeObj = body.get("status_code");
        String rootStatus = statusObj == null ? "" : String.valueOf(statusObj).toLowerCase();
        String statusCode = statusCodeObj == null ? "" : String.valueOf(statusCodeObj);

        if (!rootStatus.equals("success") && !statusCode.equals("200")) {
            String msg = extractMessage(body);
            log.warn("IThink createOrder failed orderId={} rootStatus={} statusCode={} message={}", orderId, rootStatus, statusCode, msg);
            return new CreateOrderResponse(false, null, null, null, msg, body);
        }

        Object dataObj = body.get("data");
        Map<?, ?> shipmentData = null;

        if (dataObj instanceof Map<?, ?> m) {
            if (m.containsKey("1") && m.get("1") instanceof Map<?, ?> sm) {
                shipmentData = sm;
            } else if (m.containsKey("0") && m.get("0") instanceof Map<?, ?> sm) {
                shipmentData = sm;
            } else if (m.containsKey("shipments") && m.get("shipments") instanceof List<?> list && !list.isEmpty() && list.get(0) instanceof Map<?, ?> sm) {
                shipmentData = sm;
            } else if (m.containsKey("waybill") || m.containsKey("tracking_url")) {
                shipmentData = m;
            } else {
                for (Object val : m.values()) {
                    if (val instanceof Map<?, ?> sm) {
                        shipmentData = sm;
                        break;
                    }
                }
            }
        } else if (dataObj instanceof List<?> list && !list.isEmpty() && list.get(0) instanceof Map<?, ?> sm) {
            shipmentData = sm;
        }

        if (shipmentData != null) {
            Object itemStatus = shipmentData.get("status");
            Object remark = shipmentData.get("remark");
            String itemStatusStr = itemStatus == null ? "" : String.valueOf(itemStatus).toLowerCase();
            String remarkStr = remark == null ? "" : String.valueOf(remark).trim();

            if (itemStatusStr.equals("error") || (remarkStr.toLowerCase().contains("error") || remarkStr.toLowerCase().contains("failed") || remarkStr.toLowerCase().contains("invalid") || remarkStr.toLowerCase().contains("not serviceable"))) {
                String msg = !remarkStr.isBlank() ? remarkStr : "Logistics provider returned an error for this shipment";
                log.warn("IThink createOrder shipment error orderId={} remark={}", orderId, msg);
                return new CreateOrderResponse(false, null, null, null, msg, body);
            }

            String waybill = getFirstNonBlank(shipmentData, "waybill", "waybill_number", "awb", "awb_number");
            String trackingUrl = getFirstNonBlank(shipmentData, "tracking_url", "tracking_link");
            String logistics = getFirstNonBlank(shipmentData, "logistic_name", "logistics_name", "courier_name");

            if (waybill != null && !waybill.isBlank()) {
                log.info("IThink createOrder success orderId={} waybill={} logistics={} trackingUrl={}", orderId, waybill, logistics, trackingUrl);
                return new CreateOrderResponse(true, waybill, trackingUrl, logistics, "OK", body);
            } else if (!remarkStr.isBlank()) {
                log.warn("IThink createOrder no waybill orderId={} remark={}", orderId, remarkStr);
                return new CreateOrderResponse(false, null, null, null, remarkStr, body);
            }
        }

        String msg = extractMessage(body);
        if ("OK".equalsIgnoreCase(msg) || "Failed to create order".equalsIgnoreCase(msg)) {
            msg = "Logistics provider did not return a waybill number";
        }
        log.warn("IThink createOrder failed orderId={} message={}", orderId, msg);
        return new CreateOrderResponse(false, null, null, null, msg, body);
    }

    private static String getFirstNonBlank(Map<?, ?> map, String... keys) {
        if (map == null) return null;
        for (String k : keys) {
            Object val = map.get(k);
            if (val != null && !String.valueOf(val).isBlank()) {
                return String.valueOf(val).trim();
            }
        }
        return null;
    }

    private static String extractMessage(Map body) {
        if (body == null) {
            return "Failed to create order";
        }
        Object html = body.get("html_message");
        if (html != null && !String.valueOf(html).isBlank()) {
            return String.valueOf(html);
        }
        Object message = body.get("message");
        if (message != null && !String.valueOf(message).isBlank()) {
            return String.valueOf(message);
        }
        Object data = body.get("data");
        if (data instanceof Map<?, ?> m) {
            Object first = m.get("1");
            if (first instanceof Map<?, ?> fm) {
                Object remark = fm.get("remark");
                if (remark != null && !String.valueOf(remark).isBlank()) {
                    return String.valueOf(remark);
                }
            }
        }
        return "Failed to create order";
    }

    public record ServiceabilityResponse(boolean serviceable, BigDecimal shippingCharge, String message,
            Object raw) {
    }

    public record CreateOrderResponse(boolean success, String waybill, String trackingUrl, String logistics,
            String message, Object raw) {
    }

    public ResponseEntity<ServiceabilityResponse> serviceability(
            String deliveryPincode,
            BigDecimal weightKg,
            boolean cod,
            BigDecimal productMrp) {

        if (deliveryPincode == null || !deliveryPincode.matches("^[1-9]\\d{5}$")) {
            throw new IllegalArgumentException("Invalid deliveryPincode");
        }
        if (weightKg == null || weightKg.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Invalid weight");
        }
        if (productMrp == null || productMrp.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Invalid productMrp");
        }

        String url = normalizeBaseUrl(baseUrl) + "/api_v3/rate/check.json";

        Map<String, Object> data = new HashMap<>();
        data.put("from_pincode", pickupPincode);
        data.put("to_pincode", deliveryPincode);
        data.put("shipping_length_cms", "10");
        data.put("shipping_width_cms", "10");
        data.put("shipping_height_cms", "10");
        data.put("shipping_weight_kg", weightKg.toPlainString());
        data.put("order_type", "forward");
        data.put("payment_method", cod ? "cod" : "prepaid");
        data.put("product_mrp", productMrp.toPlainString());
        data.put("access_token", accessToken);
        data.put("secret_key", secretKey);

        Map<String, Object> payload = Map.of("data", data);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        try {
            log.info(
                    "IThink serviceability request fromPincode={} toPincode={} weightKg={} cod={} productMrp={} url={}",
                    pickupPincode, deliveryPincode, weightKg, cod, productMrp, url);
            ResponseEntity<Map> resp = restTemplate.postForEntity(url, new HttpEntity<>(payload, headers), Map.class);
            Map body = resp.getBody();
            if (body == null) {
                return ResponseEntity.ok(new ServiceabilityResponse(false, BigDecimal.ZERO,
                        "Empty response from logistics provider", null));
            }

            Object statusObj = body.get("status");
            String status = statusObj == null ? "" : String.valueOf(statusObj);
            if (!Objects.equals(status, "success")) {
                String msg = extractMessage(body);
                log.info("IThink serviceability not-serviceable toPincode={} status={} message={}", deliveryPincode,
                        status, msg);
                return ResponseEntity.ok(new ServiceabilityResponse(false, BigDecimal.ZERO, msg, body));
            }

            Object dataObj = body.get("data");
            BigDecimal minRate = extractMinRate(dataObj);
            if (minRate == null) {
                log.info("IThink serviceability rate-not-available toPincode={}", deliveryPincode);
                return ResponseEntity
                        .ok(new ServiceabilityResponse(false, BigDecimal.ZERO, "Rate not available", body));
            }

            log.info("IThink serviceability serviceable toPincode={} minRate={}", deliveryPincode, minRate);
            return ResponseEntity.ok(new ServiceabilityResponse(true, minRate, "OK", body));
        } catch (RestClientException ex) {
            log.error("IThink serviceability error toPincode={}", deliveryPincode, ex);
            return ResponseEntity
                    .ok(new ServiceabilityResponse(false, BigDecimal.ZERO, "Failed to fetch rate", ex.getMessage()));
        }
    }

    @GetMapping("/serviceability")
    public ResponseEntity<?> serviceability(
            @RequestParam MultiValueMap<String, String> allParams,
            @RequestParam("deliveryPincode") String deliveryPincode,
            @RequestParam(value = "weight", defaultValue = "0.5") BigDecimal weightKg,
            @RequestParam(value = "cod", defaultValue = "false") boolean cod,
            @RequestParam(value = "productMrp", defaultValue = "0") BigDecimal productMrp) {

        // If proxy is configured, forward request upstream and pass-through
        // body/content-type.
        if (serviceabilityProxyBaseUrl != null && !serviceabilityProxyBaseUrl.isBlank()) {
            String upstreamBase = normalizeBaseUrl(serviceabilityProxyBaseUrl);
            String upstreamUrl = UriComponentsBuilder
                    .fromHttpUrl(upstreamBase + "/api/ithink/serviceability")
                    .queryParams(allParams)
                    .build(true)
                    .toUriString();

            try {
                log.info("IThink serviceability proxy call to upstreamUrl={}", upstreamUrl);
                ResponseEntity<String> upstreamResp = restTemplate.exchange(upstreamUrl, HttpMethod.GET,
                        HttpEntity.EMPTY, String.class);
                HttpHeaders headers = new HttpHeaders();
                MediaType ct = upstreamResp.getHeaders().getContentType();
                headers.setContentType(ct != null ? ct : MediaType.APPLICATION_JSON);
                return new ResponseEntity(upstreamResp.getBody(), headers, upstreamResp.getStatusCode());
            } catch (RestClientException ex) {
                log.error("IThink serviceability proxy error upstreamUrl={}", upstreamUrl, ex);
                return ResponseEntity.ok(new ServiceabilityResponse(false, BigDecimal.ZERO,
                        "Failed to fetch serviceability", ex.getMessage()));
            }
        }

        return serviceability(deliveryPincode, weightKg, cod, productMrp);
    }

    private static String normalizeBaseUrl(String baseUrl) {
        if (baseUrl == null || baseUrl.isBlank()) {
            return "https://my.ithinklogistics.com";
        }
        if (baseUrl.endsWith("/")) {
            return baseUrl.substring(0, baseUrl.length() - 1);
        }
        return baseUrl;
    }

    private static BigDecimal extractMinRate(Object dataObj) {
        if (!(dataObj instanceof List<?> list)) {
            return null;
        }

        BigDecimal min = null;
        for (Object item : list) {
            if (!(item instanceof Map<?, ?> m)) {
                continue;
            }
            Object rateObj = m.get("rate");
            if (rateObj == null) {
                continue;
            }

            try {
                BigDecimal rate = new BigDecimal(String.valueOf(rateObj));
                if (min == null || rate.compareTo(min) < 0) {
                    min = rate;
                }
            } catch (NumberFormatException ignored) {
            }
        }
        return min;
    }
}
