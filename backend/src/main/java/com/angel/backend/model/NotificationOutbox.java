package com.angel.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "notification_outbox")
public class NotificationOutbox {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    private UUID orderId;
    private String orderNumber;
    private String channel;
    private String eventType;
    private String recipient;
    private String subject;
    @Column(columnDefinition = "TEXT")
    private String message;
    @Column(columnDefinition = "TEXT")
    private String secureUrl;
    private String status = "PENDING";
    private Integer attempts = 0;
    private LocalDateTime nextAttemptAt;
    private LocalDateTime sentAt;
    private String lastError;
    @CreationTimestamp
    private LocalDateTime createdAt;
}
