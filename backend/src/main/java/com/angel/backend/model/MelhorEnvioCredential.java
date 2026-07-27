package com.angel.backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Column;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "melhor_envio_credentials")
public class MelhorEnvioCredential {
    @Id
    private Long id = 1L;
    @Column(columnDefinition = "TEXT")
    private String accessToken;
    @Column(columnDefinition = "TEXT")
    private String refreshToken;
    private String tokenType;
    private LocalDateTime accessExpiresAt;
    private LocalDateTime refreshExpiresAt;
    private String environment;
    private LocalDateTime updatedAt;
}
