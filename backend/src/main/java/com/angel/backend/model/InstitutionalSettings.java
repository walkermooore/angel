package com.angel.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "institutional_settings")
public class InstitutionalSettings {

    @Id
    private Long id = 1L;

    @Column(name = "terms_content", columnDefinition = "TEXT", nullable = false)
    private String termsContent;

    @Column(name = "exchanges_content", columnDefinition = "TEXT", nullable = false)
    private String exchangesContent;

    @Column(name = "privacy_content", columnDefinition = "TEXT", nullable = false)
    private String privacyContent;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
