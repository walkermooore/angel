package com.angel.backend.service;

import com.angel.backend.dto.PublicOrderTrackingRequest;
import com.angel.backend.dto.PublicOrderTrackingResponse;
import com.angel.backend.exception.CheckoutException;
import com.angel.backend.model.AuditLog;
import com.angel.backend.model.PurchaseOrder;
import com.angel.backend.repository.AuditLogRepository;
import com.angel.backend.repository.PurchaseOrderRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class PublicOrderTrackingService {
    private static final int MAX_ATTEMPTS = 10;
    private static final long WINDOW_SECONDS = 600;

    private final PurchaseOrderRepository orderRepository;
    private final AuditLogRepository auditLogRepository;
    private final Map<String, AttemptWindow> attempts = new ConcurrentHashMap<>();

    public PublicOrderTrackingService(PurchaseOrderRepository orderRepository, AuditLogRepository auditLogRepository) {
        this.orderRepository = orderRepository;
        this.auditLogRepository = auditLogRepository;
    }

    public PublicOrderTrackingResponse track(PublicOrderTrackingRequest request, String clientIp) {
        String number = request.number().trim().toUpperCase();
        checkRateLimit(clientIp + ":" + number, number);
        PurchaseOrder order = orderRepository.findByNumber(number)
            .orElseThrow(() -> new CheckoutException(HttpStatus.NOT_FOUND, "Pedido não encontrado."));

        boolean validToken = request.trackingToken() != null
            && constantTimeEquals(order.getPublicTrackingToken(), request.trackingToken().trim());
        boolean validContact = request.contact() != null && matchesContact(order, request.contact());
        if (!validToken && !validContact) {
            recordSuspicious(number, clientIp, "Contato ou token inválido");
            throw new CheckoutException(HttpStatus.NOT_FOUND, "Pedido não encontrado.");
        }

        return new PublicOrderTrackingResponse(
            order.getNumber(),
            order.getStatus().getDescription(),
            order.getShippingOption(),
            order.getTrackingCode(),
            maskEmail(order.getEmail()),
            maskPhone(order.getPhone()),
            order.getCreatedAt(),
            order.getItems().stream()
                .map(item -> new PublicOrderTrackingResponse.Item(item.getName(), item.getQuantity()))
                .toList()
        );
    }

    private boolean matchesContact(PurchaseOrder order, String supplied) {
        String value = supplied.trim();
        if (value.contains("@")) return order.getEmail() != null && order.getEmail().equalsIgnoreCase(value);
        return digits(order.getPhone()).equals(digits(value)) && digits(value).length() >= 10;
    }

    private void checkRateLimit(String key, String orderNumber) {
        long now = Instant.now().getEpochSecond();
        AttemptWindow window = attempts.compute(key, (ignored, current) -> {
            if (current == null || now - current.startedAt > WINDOW_SECONDS) return new AttemptWindow(now);
            current.count.incrementAndGet();
            return current;
        });
        if (window.count.get() > MAX_ATTEMPTS) {
            recordSuspicious(orderNumber, key, "Limite de tentativas públicas excedido");
            throw new CheckoutException(HttpStatus.TOO_MANY_REQUESTS, "Muitas tentativas. Aguarde alguns minutos.");
        }
    }

    private void recordSuspicious(String number, String source, String reason) {
        auditLogRepository.save(new AuditLog(number, "Tentativa de rastreamento", "Público",
            reason + ". Origem: " + source));
    }

    private boolean constantTimeEquals(String expected, String supplied) {
        if (expected == null || supplied == null || expected.length() != supplied.length()) return false;
        int difference = 0;
        for (int index = 0; index < expected.length(); index++) {
            difference |= expected.charAt(index) ^ supplied.charAt(index);
        }
        return difference == 0;
    }

    private String maskEmail(String value) {
        if (value == null || !value.contains("@")) return "";
        String[] parts = value.split("@", 2);
        return parts[0].substring(0, Math.min(2, parts[0].length())) + "***@" + parts[1];
    }

    private String maskPhone(String value) {
        String clean = digits(value);
        return clean.length() < 4 ? "***" : "***" + clean.substring(clean.length() - 4);
    }

    private String digits(String value) {
        return value == null ? "" : value.replaceAll("\\D", "");
    }

    private static final class AttemptWindow {
        private final long startedAt;
        private final AtomicInteger count = new AtomicInteger(1);
        private AttemptWindow(long startedAt) { this.startedAt = startedAt; }
    }
}
