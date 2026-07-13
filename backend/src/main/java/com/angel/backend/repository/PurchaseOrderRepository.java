package com.angel.backend.repository;

import com.angel.backend.model.PurchaseOrder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PurchaseOrderRepository extends JpaRepository <PurchaseOrder, UUID> {
}
