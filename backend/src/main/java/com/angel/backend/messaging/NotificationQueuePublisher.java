package com.angel.backend.messaging;

import java.util.UUID;

public interface NotificationQueuePublisher {
    void publish(UUID notificationId);
    void sendToDeadLetter(UUID notificationId, String reason);
}
