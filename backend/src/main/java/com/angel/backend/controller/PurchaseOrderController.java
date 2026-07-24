package com.angel.backend.controller;

import com.angel.backend.enums.Status;
import com.angel.backend.model.AuditLog;
import com.angel.backend.model.PurchaseOrder;
import com.angel.backend.repository.AuditLogRepository;
import com.angel.backend.repository.PurchaseOrderRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/pedidos")
public class PurchaseOrderController {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final AuditLogRepository auditLogRepository;

    public PurchaseOrderController(PurchaseOrderRepository purchaseOrderRepository, AuditLogRepository auditLogRepository) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.auditLogRepository = auditLogRepository;
    }

    private Optional<PurchaseOrder> findByIdOrNumber(String idOrNumber) {
        try {
            UUID id = UUID.fromString(idOrNumber);
            Optional<PurchaseOrder> byId = purchaseOrderRepository.findById(id);
            if (byId.isPresent()) return byId;
        } catch (Exception ignored) {}
        return purchaseOrderRepository.findByNumber(idOrNumber);
    }

    @GetMapping
    public List<PurchaseOrder> listarPedidos() {
        return purchaseOrderRepository.findAllByOrderByCreatedAtDesc();
    }

    @GetMapping("/{idOrNumber}")
    public ResponseEntity<PurchaseOrder> buscarPedido(@PathVariable String idOrNumber) {
        return findByIdOrNumber(idOrNumber)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<PurchaseOrder> criarPedido(@RequestBody PurchaseOrder order) {
        // Force id to null so JPA generates a fresh UUID in PostgreSQL
        order.setId(null);

        if (order.getNumber() == null || order.getNumber().isBlank()) {
            order.setNumber("ANG-" + (1000 + (int)(Math.random() * 9000)));
        }
        if (order.getStatus() == null) {
            order.setStatus(Status.PENDENTE);
        }

        PurchaseOrder saved = purchaseOrderRepository.save(order);

        // Safe audit log insertion
        try {
            auditLogRepository.save(new AuditLog(
                saved.getNumber(),
                "Criado",
                "Cliente",
                "Pedido criado via checkout com total de R$ " + saved.getTotal()
            ));
        } catch (Exception e) {
            // Silently ignore audit log errors to prevent transaction rollback
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PatchMapping("/{idOrNumber}/status")
    public ResponseEntity<PurchaseOrder> atualizarStatus(@PathVariable String idOrNumber, @RequestBody Map<String, String> body) {
        return findByIdOrNumber(idOrNumber).map(order -> {
            String newStatusStr = body.get("status");
            if (newStatusStr != null) {
                Status oldStatus = order.getStatus();
                Status newStatus = parseStatus(newStatusStr);
                order.setStatus(newStatus);
                purchaseOrderRepository.save(order);

                try {
                    auditLogRepository.save(new AuditLog(
                        order.getNumber(),
                        "Status Alterado",
                        "Admin",
                        "Status alterado de '" + (oldStatus != null ? oldStatus.getDescription() : "Desconhecido") + "' para '" + newStatus.getDescription() + "'"
                    ));
                } catch (Exception ignored) {}
            }
            return ResponseEntity.ok(order);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{idOrNumber}/tracking-code")
    public ResponseEntity<PurchaseOrder> atualizarRastreio(@PathVariable String idOrNumber, @RequestBody Map<String, String> body) {
        return findByIdOrNumber(idOrNumber).map(order -> {
            String code = body.get("trackingCode");
            order.setTrackingCode(code);
            purchaseOrderRepository.save(order);

            try {
                auditLogRepository.save(new AuditLog(
                    order.getNumber(),
                    "Rastreio Atualizado",
                    "Admin",
                    "Código de rastreio atualizado para: " + code
                ));
            } catch (Exception ignored) {}
            return ResponseEntity.ok(order);
        }).orElse(ResponseEntity.notFound().build());
    }

    private Status parseStatus(String str) {
        if (str == null) return Status.PENDENTE;
        switch (str.toLowerCase()) {
            case "pago": return Status.PAGO;
            case "enviado":
            case "pronto para retirada": return Status.ENVIADO;
            case "concluído":
            case "concluido": return Status.CONCLUIDO;
            case "cancelado": return Status.CANCELADO;
            default:
                try {
                    return Status.valueOf(str.toUpperCase());
                } catch (Exception e) {
                    return Status.PENDENTE;
                }
        }
    }
}
