package com.angel.backend.service;

import com.angel.backend.dto.CreateAfterSalesRequest;
import com.angel.backend.dto.UpdateAfterSalesRequest;
import com.angel.backend.enums.Status;
import com.angel.backend.exception.CheckoutException;
import com.angel.backend.model.AfterSalesRequest;
import com.angel.backend.model.AuditLog;
import com.angel.backend.model.PurchaseOrder;
import com.angel.backend.repository.AfterSalesRequestRepository;
import com.angel.backend.repository.AuditLogRepository;
import com.angel.backend.repository.PurchaseOrderRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class AfterSalesService {
    private static final Set<String> TYPES = Set.of("CANCELAMENTO", "TROCA", "DEVOLUCAO");
    private static final Set<String> STATUSES = Set.of(
        "RECEBIDA", "EM_ANALISE", "APROVADA", "AGUARDANDO_ENVIO", "ITEM_RECEBIDO", "CONCLUIDA", "RECUSADA", "CANCELADA");
    private static final Set<String> REFUND_STATUSES = Set.of(
        "NOT_REQUESTED", "PENDING", "PROCESSING", "COMPLETED", "FAILED");

    private final AfterSalesRequestRepository repository;
    private final PurchaseOrderRepository orderRepository;
    private final AuditLogRepository auditRepository;
    private final InventoryService inventoryService;
    private final TransactionalNotificationService notifications;
    private final String mediaPublicBaseUrl;

    public AfterSalesService(
        AfterSalesRequestRepository repository,
        PurchaseOrderRepository orderRepository,
        AuditLogRepository auditRepository,
        InventoryService inventoryService,
        TransactionalNotificationService notifications,
        @Value("${app.media.public-base-url:http://localhost:8081/api/media/images}") String mediaPublicBaseUrl
    ) {
        this.repository = repository;
        this.orderRepository = orderRepository;
        this.auditRepository = auditRepository;
        this.inventoryService = inventoryService;
        this.notifications = notifications;
        this.mediaPublicBaseUrl = mediaPublicBaseUrl.replaceAll("/+$", "");
    }

    @Transactional
    public AfterSalesRequest create(CreateAfterSalesRequest request) {
        PurchaseOrder order = orderRepository.findByNumber(request.orderNumber().trim().toUpperCase())
            .orElseThrow(() -> new CheckoutException(HttpStatus.NOT_FOUND, "Pedido não encontrado."));
        authorize(order, request.trackingToken(), request.contact());
        String type = normalize(request.requestType());
        if (!TYPES.contains(type)) throw new CheckoutException(HttpStatus.BAD_REQUEST, "Tipo de solicitação inválido.");
        validateWindow(order, type);

        AfterSalesRequest item = new AfterSalesRequest();
        item.setProtocol("POS-" + LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE) + "-"
            + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        item.setAccessToken(randomToken());
        item.setOrderId(order.getId());
        item.setOrderNumber(order.getNumber());
        item.setRequestType(type);
        item.setReason(request.reason().trim());
        item.setDetails(trim(request.details()));
        item.setStatus("RECEBIDA");
        item.setDeadlineAt(LocalDateTime.now().plusDays(type.equals("CANCELAMENTO") ? 2 : 7));
        item.setAttachmentUrls(validateAttachments(request.attachmentUrls()));
        AfterSalesRequest saved = repository.save(item);

        auditRepository.save(new AuditLog(order.getNumber(), "Pós-venda criado", "Cliente",
            "Solicitação " + saved.getProtocol() + " criada: " + type + "."));
        notifications.queueAfterSalesEvent(order, saved.getProtocol(), saved.getAccessToken(),
            "AFTER_SALES_CREATED", "Recebemos sua solicitação " + saved.getProtocol() + ".");
        return saved;
    }

    @Transactional
    public AfterSalesRequest update(UUID id, UpdateAfterSalesRequest request) {
        AfterSalesRequest item = repository.findById(id)
            .orElseThrow(() -> new CheckoutException(HttpStatus.NOT_FOUND, "Solicitação não encontrada."));
        PurchaseOrder order = orderRepository.findById(item.getOrderId())
            .orElseThrow(() -> new CheckoutException(HttpStatus.NOT_FOUND, "Pedido não encontrado."));
        String oldStatus = item.getStatus();

        if (request.status() != null) {
            String status = normalize(request.status());
            if (!STATUSES.contains(status)) throw new CheckoutException(HttpStatus.BAD_REQUEST, "Status inválido.");
            item.setStatus(status);
            if ("APROVADA".equals(status) && "CANCELAMENTO".equals(item.getRequestType())
                && order.getStatus() != Status.CANCELADO) {
                Status previous = order.getStatus();
                inventoryService.applyStatusTransition(order, previous, Status.CANCELADO, "Admin pós-venda");
                order.setStatus(Status.CANCELADO);
                orderRepository.save(order);
            }
        }
        if (request.refundStatus() != null) {
            String refund = normalize(request.refundStatus());
            if (!REFUND_STATUSES.contains(refund)) throw new CheckoutException(HttpStatus.BAD_REQUEST, "Status de estorno inválido.");
            item.setRefundStatus(refund);
        }
        if (request.adminNote() != null) item.setAdminNote(trim(request.adminNote()));
        if (Boolean.TRUE.equals(request.returnToStock()) && !Boolean.TRUE.equals(item.getReturnedToStock())) {
            inventoryService.returnSoldItems(order, "Admin pós-venda");
            item.setReturnedToStock(true);
        }

        AfterSalesRequest saved = repository.save(item);
        auditRepository.save(new AuditLog(order.getNumber(), "Pós-venda atualizado", "Admin",
            "Solicitação " + item.getProtocol() + ": " + oldStatus + " → " + item.getStatus()
                + "; estorno " + item.getRefundStatus() + "."));
        notifications.queueAfterSalesEvent(order, item.getProtocol(), item.getAccessToken(),
            "AFTER_SALES_UPDATED", "Sua solicitação " + item.getProtocol() + " foi atualizada para "
                + human(item.getStatus()) + ".");
        return saved;
    }

    public AfterSalesRequest track(String protocol, String token) {
        return repository.findByProtocolAndAccessToken(protocol, token)
            .orElseThrow(() -> new CheckoutException(HttpStatus.NOT_FOUND, "Solicitação não encontrada."));
    }

    private void authorize(PurchaseOrder order, String token, String contact) {
        if (token != null && token.equals(order.getPublicTrackingToken())) return;
        String normalizedContact = contact == null ? "" : contact.trim().toLowerCase();
        String phone = normalizedContact.replaceAll("\\D", "");
        if (normalizedContact.equalsIgnoreCase(order.getEmail())
            || (!phone.isBlank() && phone.equals(order.getPhone()))) return;
        throw new CheckoutException(HttpStatus.NOT_FOUND, "Pedido não encontrado.");
    }

    private void validateWindow(PurchaseOrder order, String type) {
        if ("CANCELAMENTO".equals(type)
            && order.getStatus() != Status.PENDENTE && order.getStatus() != Status.PAGO) {
            throw new CheckoutException(HttpStatus.CONFLICT, "Este pedido já não pode ser cancelado.");
        }
        if (!"CANCELAMENTO".equals(type)
            && order.getCreatedAt() != null && order.getCreatedAt().isBefore(LocalDateTime.now().minusDays(30))) {
            throw new CheckoutException(HttpStatus.CONFLICT, "O prazo para abrir esta solicitação terminou.");
        }
    }

    private List<String> validateAttachments(List<String> urls) {
        if (urls == null) return List.of();
        return urls.stream().map(String::trim).peek(url -> {
            if (!url.startsWith(mediaPublicBaseUrl + "/")) {
                throw new CheckoutException(HttpStatus.BAD_REQUEST, "Anexo inválido.");
            }
        }).distinct().toList();
    }

    private String randomToken() {
        return UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "");
    }

    private String normalize(String value) {
        return value.trim().toUpperCase().replace(' ', '_').replace('Ç', 'C').replace('Ã', 'A');
    }

    private String trim(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String human(String value) {
        return value.toLowerCase().replace('_', ' ');
    }
}
