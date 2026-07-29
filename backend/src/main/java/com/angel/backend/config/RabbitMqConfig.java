package com.angel.backend.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConditionalOnProperty(name = "app.rabbitmq.enabled", havingValue = "true")
public class RabbitMqConfig {
    public static final String NOTIFICATION_EXCHANGE = "angell.notifications";
    public static final String NOTIFICATION_QUEUE = "angell.notifications.dispatch";
    public static final String NOTIFICATION_ROUTING_KEY = "notification.dispatch";
    public static final String DEAD_LETTER_EXCHANGE = "angell.notifications.dlx";
    public static final String DEAD_LETTER_QUEUE = "angell.notifications.dead";
    public static final String DEAD_LETTER_ROUTING_KEY = "notification.dead";

    @Bean
    TopicExchange notificationExchange() {
        return new TopicExchange(NOTIFICATION_EXCHANGE, true, false);
    }

    @Bean
    TopicExchange notificationDeadLetterExchange() {
        return new TopicExchange(DEAD_LETTER_EXCHANGE, true, false);
    }

    @Bean
    Queue notificationQueue() {
        return QueueBuilder.durable(NOTIFICATION_QUEUE)
            .deadLetterExchange(DEAD_LETTER_EXCHANGE)
            .deadLetterRoutingKey(DEAD_LETTER_ROUTING_KEY)
            .build();
    }

    @Bean
    Queue notificationDeadLetterQueue() {
        return QueueBuilder.durable(DEAD_LETTER_QUEUE).build();
    }

    @Bean
    Binding notificationBinding(Queue notificationQueue, TopicExchange notificationExchange) {
        return BindingBuilder.bind(notificationQueue)
            .to(notificationExchange)
            .with(NOTIFICATION_ROUTING_KEY);
    }

    @Bean
    Binding notificationDeadLetterBinding(
        Queue notificationDeadLetterQueue,
        TopicExchange notificationDeadLetterExchange
    ) {
        return BindingBuilder.bind(notificationDeadLetterQueue)
            .to(notificationDeadLetterExchange)
            .with(DEAD_LETTER_ROUTING_KEY);
    }
}
