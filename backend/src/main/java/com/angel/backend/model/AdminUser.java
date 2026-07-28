package com.angel.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "admin_users")
public class AdminUser {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    private String role = "ADMIN";

    private boolean twoFactorEnabled;

    @Column(length = 1000)
    private String twoFactorSecret;

    @Column(length = 1000)
    private String pendingTwoFactorSecret;

    @CreationTimestamp
    private LocalDateTime createdAt;

    public AdminUser(String name, String email, String password) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = "ADMIN";
    }
}
