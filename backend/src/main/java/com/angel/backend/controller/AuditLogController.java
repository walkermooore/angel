package com.angel.backend.controller;

import com.angel.backend.model.AuditLog;
import com.angel.backend.repository.AuditLogRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auditoria")
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;

    public AuditLogController(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @GetMapping
    public List<AuditLog> listarLogs() {
        return auditLogRepository.findAllByOrderByTimestampDesc();
    }

    @PostMapping
    public AuditLog registrarLog(@RequestBody AuditLog log) {
        return auditLogRepository.save(log);
    }
}
