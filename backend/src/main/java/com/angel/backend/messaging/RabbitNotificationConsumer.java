package com.angel.backend.messaging;

import com.angel.backend.config.RabbitMqConfig;
import com.angel.backend.service.TransactionalNotificationService;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@ConditionalOnProperty(name = "app.rabbitmq.enabled", havingValue = "true")
public class RabbitNotificationConsumer {
    private final TransactionalNotificationService notifications;

    public RabbitNotificationConsumer(TransactionalNotificationService notifications) {
        this.notifications = notifications;
    }

    @RabbitListener(queues = RabbitMqConfig.NOTIFICATION_QUEUE)
    public void consume(String notificationId) {
        notifications.dispatchQueued(UUID.fromString(notificationId));
    }
}
