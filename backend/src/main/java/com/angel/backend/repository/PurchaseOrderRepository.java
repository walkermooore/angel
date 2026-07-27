package com.angel.backend.repository;

import com.angel.backend.model.PurchaseOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.time.LocalDateTime;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, UUID> {
    Optional<PurchaseOrder> findByNumber(String number);
    Optional<PurchaseOrder> findByIdempotencyKey(String idempotencyKey);
    Optional<PurchaseOrder> findByNumberAndPublicTrackingToken(String number, String publicTrackingToken);
    List<PurchaseOrder> findByStatusAndReservationExpiresAtBefore(com.angel.backend.enums.Status status, LocalDateTime cutoff);
    List<PurchaseOrder> findAllByOrderByCreatedAtDesc();
    long countByStatusAndCreatedAtBefore(com.angel.backend.enums.Status status, LocalDateTime cutoff);
}
