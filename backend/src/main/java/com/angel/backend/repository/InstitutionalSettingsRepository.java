package com.angel.backend.repository;

import com.angel.backend.model.InstitutionalSettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InstitutionalSettingsRepository extends JpaRepository<InstitutionalSettings, Long> {
}
