package com.angel.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "admin_sessions")
public class AdminSession {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "admin_user_id", nullable = false)
    private AdminUser adminUser;

    @Column(nullable = false, unique = true)
    private String tokenId;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    private LocalDateTime lastSeenAt;
    private LocalDateTime revokedAt;
    private String ipAddress;

    @Column(length = 500)
    private String userAgent;

    public AdminSession(AdminUser user, String tokenId, LocalDateTime expiresAt, String ip, String userAgent) {
        this.adminUser = user;
        this.tokenId = tokenId;
        this.createdAt = LocalDateTime.now();
        this.lastSeenAt = this.createdAt;
        this.expiresAt = expiresAt;
        this.ipAddress = ip;
        this.userAgent = userAgent;
    }
}
