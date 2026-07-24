package com.angel.backend.repository;

import com.angel.backend.model.HomeSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HomeSettingsRepository extends JpaRepository<HomeSettings, Long> {
}
