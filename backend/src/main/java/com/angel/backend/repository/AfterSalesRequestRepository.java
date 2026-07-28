package com.angel.backend.repository;

import com.angel.backend.model.AfterSalesRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AfterSalesRequestRepository extends JpaRepository<AfterSalesRequest, UUID> {
    Optional<AfterSalesRequest> findByProtocolAndAccessToken(String protocol, String accessToken);
    List<AfterSalesRequest> findAllByOrderByCreatedAtDesc();
}
