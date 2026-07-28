package com.angel.backend.service;

import com.angel.backend.dto.InfinitePayCheckoutResponse;
import com.angel.backend.dto.InfinitePayWebhookRequest;
import com.angel.backend.enums.Status;
import com.angel.backend.exception.CheckoutException;
import com.angel.backend.model.AuditLog;
import com.angel.backend.model.OrderItem;
import com.angel.backend.model.PurchaseOrder;
import com.angel.backend.repository.AuditLogRepository;
import com.angel.backend.repository.PurchaseOrderRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class InfinitePayService {

    private final PurchaseOrderRepository orderRepository;
    private final AuditLogRepository auditLogRepository;
    private final TransactionalNotificationService notifications;
    private final InventoryService inventoryService;
    private final RestClient client;
    private final boolean enabled;
    private final String handle;
    private final String redirectBaseUrl;
    private final String webhookUrl;

    public InfinitePayService(
        PurchaseOrderRepository orderRepository,
        AuditLogRepository auditLogRepository,
        InventoryService inventoryService,
        TransactionalNotificationService notifications,
        @Value("${app.infinitepay.base-url:https://api.checkout.infinitepay.io}") String baseUrl,
        @Value("${app.infinitepay.enabled:false}") boolean enabled,
        @Value("${app.infinitepay.handle:}") String handle,
        @Value("${app.infinitepay.redirect-base-url:http://localhost:5173}") String redirectBaseUrl,
        @Value("${app.infinitepay.webhook-url:}") String webhookUrl
    ) {
        this.orderRepository = orderRepository;
        this.auditLogRepository = auditLogRepository;
        this.inventoryService = inventoryService;
        this.notifications = notifications;
        this.client = RestClient.builder().baseUrl(baseUrl).build();
        this.enabled = enabled;
        this.handle = normalizeHandle(handle);
        this.redirectBaseUrl = stripTrailingSlash(redirectBaseUrl);
        this.webhookUrl = webhookUrl == null ? "" : webhookUrl.trim();
    }

    public boolean isReady() {
        return enabled && !handle.isBlank() && !redirectBaseUrl.isBlank() && !webhookUrl.isBlank();
    }

    @Transactional
    public InfinitePayCheckoutResponse createCheckout(String orderNumber, String trackingToken) {
        ensureReady();
        PurchaseOrder order = orderRepository.findByNumber(orderNumber)
            .filter(item -> trackingToken.equals(item.getPublicTrackingToken()))
            .orElseThrow(() -> new CheckoutException(HttpStatus.NOT_FOUND, "Pedido não encontrado."));

        if (order.getStatus() != Status.PENDENTE) {
            throw new CheckoutException(HttpStatus.CONFLICT, "Este pedido não está aguardando pagamento.");
        }
        if (order.getPaymentCheckoutUrl() != null && !order.getPaymentCheckoutUrl().isBlank()) {
            return new InfinitePayCheckoutResponse(order.getPaymentCheckoutUrl());
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("handle", handle);
        payload.put("order_nsu", order.getNumber());
        payload.put("redirect_url", redirectUrl(order));
        payload.put("webhook_url", webhookUrl);
        payload.put("items", paymentItems(order));
        payload.put("customer", Map.of(
            "name", order.getCustomerName(),
            "email", order.getEmail(),
            "phone_number", brazilianPhone(order.getPhone())
        ));
        if (!"retirada".equals(order.getShippingOption()) && order.getAddress() != null) {
            payload.put("address", Map.of(
                "cep", digits(order.getAddress().getCep()),
                "street", order.getAddress().getStreet(),
                "neighborhood", order.getAddress().getNeighborhood(),
                "number", order.getAddress().getNumber(),
                "complement", order.getAddress().getComplement() == null ? "" : order.getAddress().getComplement()
            ));
        }

        try {
            JsonNode response = client.post().uri("/links").body(payload).retrieve().body(JsonNode.class);
            String checkoutUrl = response == null ? "" : response.path("url").asText(
                response.path("checkout_url").asText("")
            );
            validateCheckoutUrl(checkoutUrl);
            order.setPaymentProvider("INFINITEPAY");
            order.setPaymentCheckoutUrl(checkoutUrl);
            orderRepository.save(order);
            return new InfinitePayCheckoutResponse(checkoutUrl);
        } catch (CheckoutException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new CheckoutException(HttpStatus.BAD_GATEWAY,
                "Não foi possível iniciar o pagamento na InfinitePay.");
        }
    }

    @Transactional
    public void confirmWebhook(InfinitePayWebhookRequest webhook) {
        ensureReady();
        if (webhook == null || blank(webhook.orderNsu()) || blank(webhook.transactionNsu())
            || blank(webhook.invoiceSlug())) {
            throw new CheckoutException(HttpStatus.BAD_REQUEST, "Notificação de pagamento incompleta.");
        }

        PurchaseOrder order = orderRepository.findByNumber(webhook.orderNsu())
            .orElseThrow(() -> new CheckoutException(HttpStatus.BAD_REQUEST, "Pedido não encontrado."));
        long expectedAmount = cents(order.getTotal());
        JsonNode verification;
        try {
            verification = client.post().uri("/payment_check").body(Map.of(
                "handle", handle,
                "order_nsu", order.getNumber(),
                "transaction_nsu", webhook.transactionNsu(),
                "slug", webhook.invoiceSlug()
            )).retrieve().body(JsonNode.class);
        } catch (Exception exception) {
            throw new CheckoutException(HttpStatus.BAD_REQUEST, "Não foi possível confirmar o pagamento.");
        }

        boolean paid = verification != null
            && verification.path("success").asBoolean(false)
            && verification.path("paid").asBoolean(false);
        long verifiedAmount = verification == null ? -1 : verification.path("amount").asLong(-1);
        if (!paid || verifiedAmount != expectedAmount || webhook.amount() == null || webhook.amount() != expectedAmount) {
            throw new CheckoutException(HttpStatus.BAD_REQUEST, "Pagamento não confirmado ou valor divergente.");
        }

        if (order.getPaymentTransactionNsu() != null
            && !order.getPaymentTransactionNsu().equals(webhook.transactionNsu())) {
            throw new CheckoutException(HttpStatus.CONFLICT, "O pedido já possui outra transação.");
        }

        order.setPaymentProvider("INFINITEPAY");
        order.setPaymentInvoiceSlug(webhook.invoiceSlug());
        order.setPaymentTransactionNsu(webhook.transactionNsu());
        order.setPaymentReceiptUrl(webhook.receiptUrl());
        order.setPaymentCaptureMethod(verification.path("capture_method").asText(webhook.captureMethod()));
        order.setPaymentInstallments(verification.path("installments").asInt(
            webhook.installments() == null ? 1 : webhook.installments()
        ));

        if (order.getStatus() == Status.PENDENTE) {
            inventoryService.applyStatusTransition(order, Status.PENDENTE, Status.PAGO, "InfinitePay");
            order.setStatus(Status.PAGO);
            order.setPaymentConfirmedAt(LocalDateTime.now());
            auditLogRepository.save(new AuditLog(
                order.getNumber(),
                "Pagamento Aprovado",
                "InfinitePay",
                "Pagamento confirmado pela API da InfinitePay."
            ));
            notifications.queueOrderEvent(order, "PAYMENT_CONFIRMED",
                "Pagamento confirmado. O pedido " + order.getNumber() + " está em preparação.");
        }
        orderRepository.save(order);
    }

    private List<Map<String, Object>> paymentItems(PurchaseOrder order) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (OrderItem item : order.getItems()) {
            result.add(Map.of(
                "quantity", item.getQuantity(),
                "price", cents(item.getPrice()),
                "description", item.getName()
            ));
        }
        if (order.getShipping() != null && order.getShipping().signum() > 0) {
            result.add(Map.of(
                "quantity", 1,
                "price", cents(order.getShipping()),
                "description", "Frete"
            ));
        }
        long payloadTotal = result.stream()
            .mapToLong(item -> ((Number) item.get("price")).longValue() * ((Number) item.get("quantity")).longValue())
            .sum();
        if (payloadTotal != cents(order.getTotal())) {
            throw new CheckoutException(HttpStatus.CONFLICT, "Os valores do pedido não fecham para o pagamento.");
        }
        return result;
    }

    private String redirectUrl(PurchaseOrder order) {
        return redirectBaseUrl + "/pedido-concluido?n=" + order.getNumber()
            + "&t=" + order.getPublicTrackingToken();
    }

    private void ensureReady() {
        if (!isReady()) {
            throw new CheckoutException(HttpStatus.SERVICE_UNAVAILABLE,
                "A InfinitePay ainda não foi configurada.");
        }
    }

    private void validateCheckoutUrl(String value) {
        try {
            URI uri = URI.create(value);
            String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase();
            boolean trustedHost = host.equals("infinitepay.io") || host.endsWith(".infinitepay.io")
                || host.equals("infinitepay.com.br") || host.endsWith(".infinitepay.com.br");
            if (!"https".equals(uri.getScheme()) || !trustedHost) throw new IllegalArgumentException();
        } catch (Exception exception) {
            throw new CheckoutException(HttpStatus.BAD_GATEWAY, "A InfinitePay retornou um link inválido.");
        }
    }

    private long cents(BigDecimal value) {
        return value.movePointRight(2).setScale(0, RoundingMode.UNNECESSARY).longValueExact();
    }

    private String brazilianPhone(String value) {
        String number = digits(value);
        return number.startsWith("55") ? "+" + number : "+55" + number;
    }

    private String normalizeHandle(String value) {
        if (value == null) return "";
        return value.trim().replaceFirst("^\\$", "");
    }

    private String digits(String value) {
        return value == null ? "" : value.replaceAll("\\D", "");
    }

    private boolean blank(String value) {
        return value == null || value.isBlank();
    }

    private String stripTrailingSlash(String value) {
        return value == null ? "" : value.trim().replaceFirst("/+$", "");
    }
}
