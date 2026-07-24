package com.angel.backend.repository;

import com.angel.backend.model.AboutSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AboutSettingsRepository extends JpaRepository<AboutSettings, Long> {
}
