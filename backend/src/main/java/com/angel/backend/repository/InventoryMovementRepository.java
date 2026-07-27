package com.angel.backend.repository;

import com.angel.backend.model.InventoryMovement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, UUID> {
    List<InventoryMovement> findByProductIdOrderByCreatedAtDesc(UUID productId);
}
