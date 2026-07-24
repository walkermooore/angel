package com.angel.backend.repository;

import com.angel.backend.model.FaqItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface FaqRepository extends JpaRepository<FaqItem, UUID> {
}
