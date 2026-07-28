package com.angel.backend.controller;

import com.angel.backend.dto.InfinitePayCheckoutRequest;
import com.angel.backend.dto.InfinitePayCheckoutResponse;
import com.angel.backend.dto.InfinitePayWebhookRequest;
import com.angel.backend.service.InfinitePayService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/pagamentos/infinitepay")
public class InfinitePayController {

    private final InfinitePayService service;

    public InfinitePayController(InfinitePayService service) {
        this.service = service;
    }

    @GetMapping("/status")
    public Map<String, Boolean> status() {
        return Map.of("enabled", service.isReady());
    }

    @PostMapping("/checkout")
    public InfinitePayCheckoutResponse checkout(@Valid @RequestBody InfinitePayCheckoutRequest request) {
        return service.createCheckout(request.orderNumber(), request.trackingToken());
    }

    @PostMapping("/webhook")
    public Map<String, Object> webhook(@RequestBody InfinitePayWebhookRequest request) {
        service.confirmWebhook(request);
        return Map.of("success", true, "message", "");
    }
}
