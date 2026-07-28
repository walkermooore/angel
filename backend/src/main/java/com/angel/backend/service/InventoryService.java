package com.angel.backend.service;

import com.angel.backend.enums.Status;
import com.angel.backend.exception.CheckoutException;
import com.angel.backend.model.InventoryMovement;
import com.angel.backend.model.OrderItem;
import com.angel.backend.model.Product;
import com.angel.backend.model.PurchaseOrder;
import com.angel.backend.repository.InventoryMovementRepository;
import com.angel.backend.repository.ProductRepository;
import com.angel.backend.repository.PurchaseOrderRepository;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class InventoryService {
    private final ProductRepository productRepository;
    private final PurchaseOrderRepository orderRepository;
    private final InventoryMovementRepository movementRepository;
    private final TransactionalNotificationService notifications;

    public InventoryService(ProductRepository productRepository, PurchaseOrderRepository orderRepository,
                            InventoryMovementRepository movementRepository,
                            TransactionalNotificationService notifications) {
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.movementRepository = movementRepository;
        this.notifications = notifications;
    }

    public void reserve(Product product, int quantity) {
        int available = value(product.getStockQuantity()) - value(product.getReservedQuantity());
        if (available < quantity) {
            throw new CheckoutException(HttpStatus.CONFLICT,
                "Estoque insuficiente para " + product.getName() + ". Disponível: " + available);
        }
        product.setReservedQuantity(value(product.getReservedQuantity()) + quantity);
    }

    @Transactional
    public void applyStatusTransition(PurchaseOrder order, Status oldStatus, Status newStatus, String actor) {
        if (oldStatus == newStatus) return;
        if ("RESERVED".equals(order.getInventoryState()) && newStatus == Status.PAGO) {
            settle(order, actor);
        } else if ("RESERVED".equals(order.getInventoryState()) && newStatus == Status.CANCELADO) {
            release(order, actor, "Pedido cancelado; reserva liberada");
        }
    }

    @Scheduled(fixedDelayString = "${app.inventory.expiration-check-ms:60000}")
    @Transactional
    public void expireReservations() {
        List<PurchaseOrder> expired = orderRepository.findByStatusAndReservationExpiresAtBefore(
            Status.PENDENTE, LocalDateTime.now());
        for (PurchaseOrder order : expired) {
            if (!"RESERVED".equals(order.getInventoryState())) continue;
            release(order, "Sistema", "Pagamento expirado; reserva liberada");
            order.setStatus(Status.CANCELADO);
            orderRepository.save(order);
            notifications.queueOrderEvent(order, "ORDER_CANCELLED",
                "O pedido " + order.getNumber() + " foi cancelado porque o prazo de pagamento terminou.");
        }
    }

    private void settle(PurchaseOrder order, String actor) {
        if (order.getItems() == null || order.getItems().isEmpty()) {
            order.setInventoryState("SOLD");
            return;
        }
        Map<UUID, Product> products = lockedProducts(order);
        for (OrderItem item : order.getItems()) {
            Product product = products.get(UUID.fromString(item.getProductId()));
            int quantity = item.getQuantity();
            product.setReservedQuantity(Math.max(0, value(product.getReservedQuantity()) - quantity));
            product.setStockQuantity(value(product.getStockQuantity()) - quantity);
            product.setSoldQuantity(value(product.getSoldQuantity()) + quantity);
            movement(product, order, "SALE", -quantity, "Pagamento confirmado; venda baixada", actor);
        }
        order.setInventoryState("SOLD");
    }

    private void release(PurchaseOrder order, String actor, String reason) {
        if (order.getItems() == null || order.getItems().isEmpty()) {
            order.setInventoryState("RELEASED");
            return;
        }
        Map<UUID, Product> products = lockedProducts(order);
        for (OrderItem item : order.getItems()) {
            Product product = products.get(UUID.fromString(item.getProductId()));
            int quantity = item.getQuantity();
            product.setReservedQuantity(Math.max(0, value(product.getReservedQuantity()) - quantity));
            movement(product, order, "RELEASE", quantity, reason, actor);
        }
        order.setInventoryState("RELEASED");
    }

    private Map<UUID, Product> lockedProducts(PurchaseOrder order) {
        Set<UUID> ids = order.getItems().stream().map(item -> UUID.fromString(item.getProductId()))
            .collect(Collectors.toSet());
        return productRepository.findAllByIdForUpdate(ids).stream()
            .collect(Collectors.toMap(Product::getId, Function.identity()));
    }

    public void movement(Product product, PurchaseOrder order, String type, int quantity, String reason, String actor) {
        InventoryMovement movement = new InventoryMovement();
        movement.setProductId(product.getId());
        movement.setOrderId(order == null ? null : order.getId());
        movement.setMovementType(type);
        movement.setQuantity(quantity);
        movement.setBalanceAfter(value(product.getStockQuantity()) - value(product.getReservedQuantity()));
        movement.setReason(reason);
        movement.setActor(actor);
        movementRepository.save(movement);
    }

    @Transactional
    public void returnSoldItems(PurchaseOrder order, String actor) {
        if (order.getItems() == null || order.getItems().isEmpty()) return;
        Map<UUID, Product> products = lockedProducts(order);
        for (OrderItem item : order.getItems()) {
            Product product = products.get(UUID.fromString(item.getProductId()));
            int quantity = item.getQuantity();
            product.setStockQuantity(value(product.getStockQuantity()) + quantity);
            product.setSoldQuantity(Math.max(0, value(product.getSoldQuantity()) - quantity));
            movement(product, order, "RETURN", quantity, "Itens devolvidos ao estoque pelo pós-venda", actor);
        }
    }

    private int value(Integer number) {
        return number == null ? 0 : number;
    }
}
