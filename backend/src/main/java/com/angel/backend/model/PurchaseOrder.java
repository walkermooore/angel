package com.angel.backend.model;

import com.angel.backend.enums.Payment;
import com.angel.backend.enums.Status;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
public class PurchaseOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true)
    private String number;

    private String phone;

    private String customerName;

    private String email;

    private String trackingCode;

    private String shippingOption;

    @Column(unique = true, length = 100)
    private String idempotencyKey;

    @Column(unique = true, length = 100)
    private String publicTrackingToken;

    private LocalDateTime reservationExpiresAt;

    @Column(nullable = false)
    private String inventoryState = "RESERVED";

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    private LocalDateTime deletedAt;

    @ElementCollection
    @CollectionTable(name = "order_items")
    private List<OrderItem> items;

    private BigDecimal subtotal;

    private BigDecimal shipping;

    private BigDecimal total;

    private String paymentProvider;

    @Column(columnDefinition = "TEXT")
    private String paymentCheckoutUrl;

    private String paymentInvoiceSlug;

    private String paymentTransactionNsu;

    @Column(columnDefinition = "TEXT")
    private String paymentReceiptUrl;

    private String paymentCaptureMethod;

    private Integer paymentInstallments;

    private LocalDateTime paymentConfirmedAt;

    @Enumerated(EnumType.STRING)
    private Status status;

    @Enumerated(EnumType.STRING)
    private Payment payment;

    @Embedded
    @AttributeOverrides({
        @AttributeOverride(name = "number", column = @Column(name = "address_number"))
    })
    private Address address;
}
