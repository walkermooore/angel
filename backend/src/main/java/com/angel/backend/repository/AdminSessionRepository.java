package com.angel.backend.repository;

import com.angel.backend.model.AdminSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AdminSessionRepository extends JpaRepository<AdminSession, UUID> {
    Optional<AdminSession> findByTokenId(String tokenId);
    List<AdminSession> findByAdminUserIdOrderByCreatedAtDesc(UUID adminUserId);
    long deleteByExpiresAtBefore(LocalDateTime threshold);
}
