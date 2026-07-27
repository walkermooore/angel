package com.angel.backend.config;

import com.angel.backend.enums.Status;
import com.angel.backend.repository.PurchaseOrderRepository;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDateTime;

@Configuration
public class OperationalMetricsConfig {

    public OperationalMetricsConfig(MeterRegistry registry, PurchaseOrderRepository orders) {
        Gauge.builder("angell.orders.stuck.pending", orders,
                repository -> repository.countByStatusAndCreatedAtBefore(
                    Status.PENDENTE, LocalDateTime.now().minusHours(24)))
            .description("Pedidos pendentes há mais de 24 horas")
            .register(registry);
    }
}
