package com.angel.backend.controller;

import com.angel.backend.exception.CheckoutException;
import com.angel.backend.model.NotificationOutbox;
import com.angel.backend.repository.NotificationOutboxRepository;
import com.angel.backend.service.TransactionalNotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/comunicacoes")
public class NotificationController {
    private final NotificationOutboxRepository repository;
    private final TransactionalNotificationService service;

    public NotificationController(NotificationOutboxRepository repository, TransactionalNotificationService service) {
        this.repository = repository;
        this.service = service;
    }

    @GetMapping
    public List<Map<String, Object>> list() {
        return repository.findAllByOrderByCreatedAtDesc().stream().map(item -> Map.<String, Object>of(
            "id", item.getId(),
            "orderNumber", item.getOrderNumber() == null ? "" : item.getOrderNumber(),
            "channel", item.getChannel(),
            "eventType", item.getEventType(),
            "recipient", mask(item.getRecipient()),
            "status", item.getStatus(),
            "attempts", item.getAttempts(),
            "createdAt", item.getCreatedAt(),
            "sentAt", item.getSentAt() == null ? "" : item.getSentAt().toString(),
            "lastError", item.getLastError() == null ? "" : item.getLastError()
        )).toList();
    }

    @PostMapping("/{id}/retry")
    public void retry(@PathVariable UUID id) {
        NotificationOutbox item = repository.findById(id)
            .orElseThrow(() -> new CheckoutException(HttpStatus.NOT_FOUND, "Comunicação não encontrada."));
        service.retry(item);
    }

    private String mask(String value) {
        if (value == null || value.length() < 5) return "***";
        if (value.contains("@")) {
            String[] parts = value.split("@", 2);
            return parts[0].substring(0, Math.min(2, parts[0].length())) + "***@" + parts[1];
        }
        return "***" + value.substring(value.length() - 4);
    }
}
