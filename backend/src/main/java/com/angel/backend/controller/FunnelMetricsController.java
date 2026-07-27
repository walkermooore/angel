package com.angel.backend.controller;

import com.angel.backend.dto.FunnelEventRequest;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/metricas/funil")
public class FunnelMetricsController {

    private final MeterRegistry registry;

    public FunnelMetricsController(MeterRegistry registry) {
        this.registry = registry;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void record(@Valid @RequestBody FunnelEventRequest request) {
        String context = normalizeContext(request.context());
        Counter.builder("angell.funnel.events")
            .description("Eventos agregados e anônimos do funil de vendas")
            .tag("event", request.event().name().toLowerCase())
            .tag("context", context)
            .register(registry)
            .increment();
    }

    private String normalizeContext(String value) {
        if (value == null || value.isBlank()) return "none";
        String normalized = value.trim().toLowerCase().replaceAll("[^a-z0-9_-]", "_");
        return normalized.substring(0, Math.min(normalized.length(), 32));
    }
}
