package com.angel.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "after_sales_request")
public class AfterSalesRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @Column(unique = true, nullable = false, length = 40)
    private String protocol;
    @Column(unique = true, nullable = false, length = 100)
    private String accessToken;
    @Column(nullable = false)
    private UUID orderId;
    @Column(nullable = false)
    private String orderNumber;
    @Column(nullable = false)
    private String requestType;
    @Column(nullable = false, length = 120)
    private String reason;
    @Column(columnDefinition = "TEXT")
    private String details;
    @Column(nullable = false)
    private String status;
    @Column(nullable = false)
    private String refundStatus = "NOT_REQUESTED";
    @Column(nullable = false)
    private LocalDateTime deadlineAt;
    @Column(nullable = false)
    private Boolean returnedToStock = false;
    @Column(columnDefinition = "TEXT")
    private String adminNote;
    @ElementCollection
    @CollectionTable(name = "after_sales_attachments", joinColumns = @JoinColumn(name = "request_id"))
    @Column(name = "attachment_url", columnDefinition = "TEXT")
    private List<String> attachmentUrls = new ArrayList<>();
    @CreationTimestamp
    private LocalDateTime createdAt;
    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
