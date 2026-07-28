package com.angel.backend.service;

import com.angel.backend.dto.CreateOrderAddressRequest;
import com.angel.backend.dto.CreateOrderItemRequest;
import com.angel.backend.dto.CreateOrderRequest;
import com.angel.backend.enums.Status;
import com.angel.backend.exception.CheckoutException;
import com.angel.backend.model.Address;
import com.angel.backend.model.AuditLog;
import com.angel.backend.model.OrderItem;
import com.angel.backend.model.Product;
import com.angel.backend.model.PurchaseOrder;
import com.angel.backend.repository.AuditLogRepository;
import com.angel.backend.repository.ProductRepository;
import com.angel.backend.repository.PurchaseOrderRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class OrderCheckoutService {

    private static final DateTimeFormatter ORDER_DATE = DateTimeFormatter.BASIC_ISO_DATE;

    private final ProductRepository productRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final AuditLogRepository auditLogRepository;
    private final MelhorEnvioService melhorEnvioService;
    private final InventoryService inventoryService;
    private final TransactionalNotificationService notifications;
    private final long reservationMinutes;

    public OrderCheckoutService(
        ProductRepository productRepository,
        PurchaseOrderRepository purchaseOrderRepository,
        AuditLogRepository auditLogRepository,
        MelhorEnvioService melhorEnvioService,
        InventoryService inventoryService,
        TransactionalNotificationService notifications,
        @Value("${app.inventory.reservation-minutes:30}") long reservationMinutes
    ) {
        this.productRepository = productRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.auditLogRepository = auditLogRepository;
        this.melhorEnvioService = melhorEnvioService;
        this.inventoryService = inventoryService;
        this.notifications = notifications;
        this.reservationMinutes = reservationMinutes;
    }

    @Transactional
    public PurchaseOrder create(CreateOrderRequest request, String idempotencyKey) {
        if (idempotencyKey == null || !idempotencyKey.matches("[A-Za-z0-9_-]{20,100}")) {
            throw new CheckoutException(HttpStatus.BAD_REQUEST, "Chave de idempotência ausente ou inválida.");
        }
        PurchaseOrder existing = purchaseOrderRepository.findByIdempotencyKey(idempotencyKey).orElse(null);
        if (existing != null) return existing;
        Map<UUID, Integer> requestedQuantities = aggregateQuantities(request.items());
        List<Product> lockedProducts = productRepository.findAllByIdForUpdate(requestedQuantities.keySet());
        Map<UUID, Product> productsById = lockedProducts.stream()
            .collect(Collectors.toMap(Product::getId, Function.identity()));

        if (productsById.size() != requestedQuantities.size()) {
            throw new CheckoutException(HttpStatus.BAD_REQUEST, "Um ou mais produtos não estão disponíveis.");
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        List<OrderItem> snapshotItems = new ArrayList<>();

        for (Map.Entry<UUID, Integer> entry : requestedQuantities.entrySet()) {
            Product product = productsById.get(entry.getKey());
            int quantity = entry.getValue();
            validateAvailability(product, quantity);

            BigDecimal originalPrice = money(product.getPrice());
            int discountPercent = validDiscount(product.getDiscountPercent());
            BigDecimal unitPrice = calculateUnitPrice(originalPrice, discountPercent);

            OrderItem snapshot = new OrderItem();
            snapshot.setProductId(product.getId().toString());
            snapshot.setName(product.getName());
            snapshot.setOriginalPrice(originalPrice);
            snapshot.setDiscountPercent(discountPercent);
            snapshot.setPrice(unitPrice);
            snapshot.setQuantity(quantity);
            snapshotItems.add(snapshot);

            subtotal = subtotal.add(unitPrice.multiply(BigDecimal.valueOf(quantity)));
            inventoryService.reserve(product, quantity);
        }

        subtotal = money(subtotal);
        boolean pickup = "retirada".equals(request.shippingOption());
        Address address = pickup ? pickupAddress() : deliveryAddress(request.address());
        validateQuote(request.shippingQuoteId(), pickup);
        BigDecimal shipping = pickup
            ? BigDecimal.ZERO.setScale(2)
            : melhorEnvioService.priceForSelectedQuote(
                request.shippingQuoteId(),
                address.getCep(),
                requestedQuantities,
                productsById
            );

        PurchaseOrder order = new PurchaseOrder();
        order.setNumber(generateOrderNumber());
        order.setCustomerName(request.customerName().trim().replaceAll("\\s+", " "));
        order.setEmail(request.email().trim().toLowerCase());
        order.setPhone(digits(request.phone()));
        order.setItems(snapshotItems);
        order.setSubtotal(subtotal);
        order.setShipping(shipping);
        order.setTotal(money(subtotal.add(shipping)));
        order.setStatus(Status.PENDENTE);
        order.setShippingOption(request.shippingOption());
        order.setPayment(request.payment());
        order.setAddress(address);
        order.setIdempotencyKey(idempotencyKey);
        order.setPublicTrackingToken(UUID.randomUUID().toString().replace("-", "")
            + UUID.randomUUID().toString().replace("-", ""));
        order.setReservationExpiresAt(LocalDateTime.now().plusMinutes(reservationMinutes));
        order.setInventoryState("RESERVED");

        PurchaseOrder saved = purchaseOrderRepository.save(order);
        for (Product product : lockedProducts) {
            inventoryService.movement(product, saved, "RESERVE", requestedQuantities.get(product.getId()),
                "Reserva criada no checkout", "Cliente");
        }
        auditLogRepository.save(new AuditLog(
            saved.getNumber(),
            "Criado",
            "Cliente",
            "Pedido criado com valores recalculados pelo servidor. Total: R$ " + saved.getTotal()
        ));
        notifications.queueOrderEvent(saved, "ORDER_CREATED",
            "Recebemos o pedido " + saved.getNumber() + ". Aguardamos a confirmação do pagamento.");
        return saved;
    }

    private Map<UUID, Integer> aggregateQuantities(List<CreateOrderItemRequest> items) {
        Map<UUID, Integer> quantities = new LinkedHashMap<>();
        for (CreateOrderItemRequest item : items) {
            quantities.merge(item.productId(), item.quantity(), Integer::sum);
            if (quantities.get(item.productId()) > 99) {
                throw new CheckoutException(HttpStatus.BAD_REQUEST, "Quantidade máxima por produto excedida.");
            }
        }
        return quantities;
    }

    private void validateAvailability(Product product, int quantity) {
        if (product.getDeletedAt() != null) {
            throw new CheckoutException(HttpStatus.BAD_REQUEST, "Produto indisponível: " + product.getName());
        }
        int stock = (product.getStockQuantity() == null ? 0 : product.getStockQuantity())
            - (product.getReservedQuantity() == null ? 0 : product.getReservedQuantity());
        if (stock < quantity) {
            throw new CheckoutException(
                HttpStatus.CONFLICT,
                "Estoque insuficiente para " + product.getName() + ". Disponível: " + stock
            );
        }
        if (product.getPrice() == null || product.getPrice().signum() <= 0) {
            throw new CheckoutException(HttpStatus.BAD_REQUEST, "Produto com preço inválido: " + product.getName());
        }
    }

    private int validDiscount(Integer discountPercent) {
        if (discountPercent == null || discountPercent <= 0) return 0;
        return Math.min(discountPercent, 100);
    }

    private BigDecimal calculateUnitPrice(BigDecimal originalPrice, int discountPercent) {
        if (discountPercent == 0) return originalPrice;
        BigDecimal multiplier = BigDecimal.ONE.subtract(
            BigDecimal.valueOf(discountPercent).divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP)
        );
        return money(originalPrice.multiply(multiplier));
    }

    private void validateQuote(String quoteId, boolean pickup) {
        boolean compatible = pickup ? "PICKUP".equals(quoteId) : quoteId != null && quoteId.matches("ME-[0-9]+");
        if (!compatible) {
            throw new CheckoutException(HttpStatus.BAD_REQUEST, "Cotação de frete incompatível com a modalidade escolhida.");
        }
    }

    private Address deliveryAddress(CreateOrderAddressRequest request) {
        if (request == null
            || blank(request.street())
            || blank(request.number())
            || blank(request.neighborhood())
            || blank(request.city())
            || blank(request.state())) {
            throw new CheckoutException(HttpStatus.BAD_REQUEST, "Endereço de entrega incompleto.");
        }
        String state = request.state().trim().toUpperCase();
        if (state.length() != 2) {
            throw new CheckoutException(HttpStatus.BAD_REQUEST, "UF inválida.");
        }
        Address address = new Address();
        address.setCep(formatCep(request.cep()));
        address.setStreet(request.street().trim());
        address.setNumber(request.number().trim());
        address.setComplement(trimToNull(request.complement()));
        address.setNeighborhood(request.neighborhood().trim());
        address.setCity(request.city().trim());
        address.setState(state);
        return address;
    }

    private Address pickupAddress() {
        Address address = new Address();
        address.setCep("78000-000");
        address.setStreet("Retirada na loja física");
        address.setNumber("500");
        address.setComplement("Centro");
        address.setNeighborhood("Centro");
        address.setCity("Cuiabá");
        address.setState("MT");
        return address;
    }

    private String generateOrderNumber() {
        return "ANG-" + LocalDate.now().format(ORDER_DATE) + "-"
            + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private String formatCep(String value) {
        String digits = digits(value);
        if (digits.length() != 8) {
            throw new CheckoutException(HttpStatus.BAD_REQUEST, "CEP de entrega inválido.");
        }
        return digits.substring(0, 5) + "-" + digits.substring(5);
    }

    private String digits(String value) {
        return value == null ? "" : value.replaceAll("\\D", "");
    }

    private boolean blank(String value) {
        return value == null || value.isBlank();
    }

    private String trimToNull(String value) {
        return blank(value) ? null : value.trim();
    }

    private BigDecimal money(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }
}
