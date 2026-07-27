package com.angel.backend.controller;

import com.angel.backend.dto.CreateOrderRequest;
import com.angel.backend.dto.PublicOrderTrackingRequest;
import com.angel.backend.dto.PublicOrderTrackingResponse;
import com.angel.backend.enums.Status;
import com.angel.backend.model.AuditLog;
import com.angel.backend.model.PurchaseOrder;
import com.angel.backend.repository.AuditLogRepository;
import com.angel.backend.repository.PurchaseOrderRepository;
import com.angel.backend.service.OrderCheckoutService;
import com.angel.backend.service.InventoryService;
import com.angel.backend.service.PublicOrderTrackingService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
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
    private final OrderCheckoutService orderCheckoutService;
    private final InventoryService inventoryService;
    private final PublicOrderTrackingService publicOrderTrackingService;

    public PurchaseOrderController(
        PurchaseOrderRepository purchaseOrderRepository,
        AuditLogRepository auditLogRepository,
        OrderCheckoutService orderCheckoutService,
        InventoryService inventoryService,
        PublicOrderTrackingService publicOrderTrackingService
    ) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.auditLogRepository = auditLogRepository;
        this.orderCheckoutService = orderCheckoutService;
        this.inventoryService = inventoryService;
        this.publicOrderTrackingService = publicOrderTrackingService;
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
    public ResponseEntity<PurchaseOrder> criarPedido(
        @RequestHeader("Idempotency-Key") String idempotencyKey,
        @Valid @RequestBody CreateOrderRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderCheckoutService.create(request, idempotencyKey));
    }

    @PostMapping("/acompanhar")
    public PublicOrderTrackingResponse acompanhar(
        @Valid @RequestBody PublicOrderTrackingRequest request,
        HttpServletRequest servletRequest
    ) {
        return publicOrderTrackingService.track(request, clientIp(servletRequest));
    }

    @PatchMapping("/{idOrNumber}/status")
    public ResponseEntity<PurchaseOrder> atualizarStatus(@PathVariable String idOrNumber, @RequestBody Map<String, String> body) {
        return findByIdOrNumber(idOrNumber).map(order -> {
            String newStatusStr = body.get("status");
            if (newStatusStr != null) {
                Status oldStatus = order.getStatus();
                Status newStatus = parseStatus(newStatusStr);
                inventoryService.applyStatusTransition(order, oldStatus, newStatus, "Admin");
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
        return Status.fromValue(str);
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        return forwarded == null || forwarded.isBlank()
            ? request.getRemoteAddr()
            : forwarded.split(",")[0].trim();
    }
}
