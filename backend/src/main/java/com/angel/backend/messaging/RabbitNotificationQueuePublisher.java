package com.angel.backend.messaging;

import com.angel.backend.config.RabbitMqConfig;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

@Component
@ConditionalOnProperty(name = "app.rabbitmq.enabled", havingValue = "true")
public class RabbitNotificationQueuePublisher implements NotificationQueuePublisher {
    private final RabbitTemplate rabbitTemplate;

    public RabbitNotificationQueuePublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    @Override
    public void publish(UUID notificationId) {
        rabbitTemplate.convertAndSend(
            RabbitMqConfig.NOTIFICATION_EXCHANGE,
            RabbitMqConfig.NOTIFICATION_ROUTING_KEY,
            notificationId.toString(),
            message -> {
                message.getMessageProperties().setMessageId(notificationId.toString());
                message.getMessageProperties().setContentType("text/plain");
                message.getMessageProperties().setHeader("event", "TRANSACTIONAL_NOTIFICATION");
                return message;
            }
        );
    }

    @Override
    public void sendToDeadLetter(UUID notificationId, String reason) {
        rabbitTemplate.convertAndSend(
            RabbitMqConfig.DEAD_LETTER_EXCHANGE,
            RabbitMqConfig.DEAD_LETTER_ROUTING_KEY,
            notificationId.toString(),
            message -> {
                message.getMessageProperties().setMessageId(notificationId.toString());
                message.getMessageProperties().setContentType("text/plain");
                message.getMessageProperties().setHeader(
                    "failureReason",
                    reason == null ? "Falha permanente" : reason
                );
                message.getMessageProperties().setHeader("failedAt", Instant.now().toString());
                return message;
            }
        );
    }
}
