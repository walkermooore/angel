package com.angel.backend.repository;

import com.angel.backend.model.NotificationOutbox;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface NotificationOutboxRepository extends JpaRepository<NotificationOutbox, UUID> {
    List<NotificationOutbox> findTop50ByStatusInAndNextAttemptAtBeforeOrderByCreatedAtAsc(
        List<String> statuses, LocalDateTime now);
    List<NotificationOutbox> findAllByOrderByCreatedAtDesc();
}
