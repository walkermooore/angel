package com.angel.backend;

import com.angel.backend.enums.Status;
import com.angel.backend.model.PurchaseOrder;
import com.angel.backend.model.Product;
import com.angel.backend.repository.ProductRepository;
import com.angel.backend.repository.PurchaseOrderRepository;
import com.angel.backend.repository.InventoryMovementRepository;
import com.angel.backend.service.InventoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityAndOrderIntegrationTests {

    private static final Pattern TOKEN_PATTERN = Pattern.compile("\"token\"\\s*:\\s*\"([^\"]+)\"");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private PurchaseOrderRepository purchaseOrderRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private InventoryMovementRepository inventoryMovementRepository;

    @Autowired
    private InventoryService inventoryService;

    private String token;

    @BeforeEach
    void authenticate() throws Exception {
        inventoryMovementRepository.deleteAll();
        purchaseOrderRepository.deleteAll();
        productRepository.deleteAll();
        String response = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email":"integration@angel.test","password":"integration-password-123"}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andReturn().getResponse().getContentAsString();

        Matcher matcher = TOKEN_PATTERN.matcher(response);
        assertThat(matcher.find()).isTrue();
        token = matcher.group(1);
    }

    @Test
    void recalculatesCheckoutAndIgnoresClientControlledCommercialValues() throws Exception {
        Product product = product("Produto oficial", "100.00", 10, 5);

        mockMvc.perform(post("/api/pedidos")
                .header("Idempotency-Key", "checkout-test-key-000000000001")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "customerName":"Cliente Teste",
                      "email":"cliente@angel.test",
                      "phone":"65999999999",
                      "items":[{
                        "productId":"%s",
                        "quantity":2
                      }],
                      "shippingOption":"retirada",
                      "shippingQuoteId":"PICKUP",
                      "payment":"PIX",
                      "address":{
                        "cep":"78000-000",
                        "street":"Rua Teste",
                        "number":"10",
                        "neighborhood":"Centro",
                        "city":"Cuiabá",
                        "state":"MT"
                      }
                    }
                    """.formatted(product.getId())))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.status").value("Pendente"))
            .andExpect(jsonPath("$.customerName").value("Cliente Teste"))
            .andExpect(jsonPath("$.items[0].name").value("Produto oficial"))
            .andExpect(jsonPath("$.items[0].originalPrice").value(100.0))
            .andExpect(jsonPath("$.items[0].discountPercent").value(10))
            .andExpect(jsonPath("$.items[0].price").value(90.0))
            .andExpect(jsonPath("$.subtotal").value(180.0))
            .andExpect(jsonPath("$.shipping").value(0.0))
            .andExpect(jsonPath("$.total").value(180.0));

        Product updated = productRepository.findById(product.getId()).orElseThrow();
        assertThat(updated.getStockQuantity()).isEqualTo(5);
        assertThat(updated.getReservedQuantity()).isEqualTo(2);
    }

    @Test
    void rejectsCheckoutWhenStockIsInsufficientWithoutChangingStock() throws Exception {
        Product product = product("Última unidade", "50.00", 0, 1);

        mockMvc.perform(post("/api/pedidos")
                .header("Idempotency-Key", "checkout-test-key-000000000002")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "customerName":"Cliente Teste",
                      "email":"cliente@angel.test",
                      "phone":"65999999999",
                      "items":[{"productId":"%s","quantity":2}],
                      "shippingOption":"retirada",
                      "shippingQuoteId":"PICKUP",
                      "payment":"PIX",
                      "address":{}
                    }
                    """.formatted(product.getId())))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Estoque insuficiente para Última unidade. Disponível: 1"));

        assertThat(productRepository.findById(product.getId()).orElseThrow().getStockQuantity()).isEqualTo(1);
        assertThat(purchaseOrderRepository.count()).isZero();
    }

    @Test
    void rejectsInactiveProductAndIncompatibleShippingQuote() throws Exception {
        Product inactive = product("Produto inativo", "75.00", 0, 3);
        inactive.setDeletedAt(LocalDateTime.now());
        productRepository.saveAndFlush(inactive);

        mockMvc.perform(post("/api/pedidos")
                .header("Idempotency-Key", "checkout-test-key-000000000003")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "customerName":"Cliente Teste",
                      "email":"cliente@angel.test",
                      "phone":"65999999999",
                      "items":[{"productId":"%s","quantity":1}],
                      "shippingOption":"retirada",
                      "shippingQuoteId":"ME-1",
                      "payment":"PIX",
                      "address":{}
                    }
                    """.formatted(inactive.getId())))
            .andExpect(status().isBadRequest());

        assertThat(purchaseOrderRepository.count()).isZero();
    }

    @Test
    void exposesFreightEndpointAndReportsMissingMelhorEnvioConfiguration() throws Exception {
        Product product = product("Produto para frete", "80.00", 0, 2);

        mockMvc.perform(post("/api/frete/cotacoes")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "cep":"78000-000",
                      "items":[{"productId":"%s","quantity":1}]
                    }
                    """.formatted(product.getId())))
            .andExpect(status().isServiceUnavailable())
            .andExpect(jsonPath("$.message").value("O Melhor Envio ainda não foi autorizado no painel administrativo."));
    }

    @Test
    void makesCheckoutIdempotentProtectsPublicTrackingAndSettlesReservedStock() throws Exception {
        Product product = product("Produto reservado", "60.00", 0, 2);
        String body = """
            {
              "customerName":"Maria da Silva",
              "email":"maria@example.com",
              "phone":"65999998888",
              "items":[{"productId":"%s","quantity":1}],
              "shippingOption":"retirada",
              "shippingQuoteId":"PICKUP",
              "payment":"PIX",
              "address":{}
            }
            """.formatted(product.getId());

        for (int attempt = 0; attempt < 2; attempt++) {
            mockMvc.perform(post("/api/pedidos")
                    .header("Idempotency-Key", "same-checkout-request-00000001")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(body))
                .andExpect(status().isCreated());
        }

        assertThat(purchaseOrderRepository.count()).isEqualTo(1);
        PurchaseOrder order = purchaseOrderRepository.findAll().getFirst();
        Product reserved = productRepository.findById(product.getId()).orElseThrow();
        assertThat(reserved.getStockQuantity()).isEqualTo(2);
        assertThat(reserved.getReservedQuantity()).isEqualTo(1);

        mockMvc.perform(get("/api/pedidos/{number}", order.getNumber()))
            .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/pedidos/acompanhar")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"number":"%s","contact":"errado@example.com"}
                    """.formatted(order.getNumber())))
            .andExpect(status().isNotFound());

        mockMvc.perform(post("/api/pedidos/acompanhar")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"number":"%s","contact":"maria@example.com"}
                    """.formatted(order.getNumber())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.number").value(order.getNumber()))
            .andExpect(jsonPath("$.maskedEmail").value("ma***@example.com"))
            .andExpect(jsonPath("$.items[0].name").value("Produto reservado"))
            .andExpect(jsonPath("$.email").doesNotExist())
            .andExpect(jsonPath("$.address").doesNotExist());

        mockMvc.perform(patch("/api/pedidos/{id}/status", order.getId())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"Pago\"}"))
            .andExpect(status().isOk());

        Product sold = productRepository.findById(product.getId()).orElseThrow();
        assertThat(sold.getStockQuantity()).isEqualTo(1);
        assertThat(sold.getReservedQuantity()).isZero();
        assertThat(sold.getSoldQuantity()).isEqualTo(1);
    }

    private Product product(String name, String price, int discountPercent, int stock) {
        Product product = new Product();
        product.setName(name);
        product.setDescription("Produto de integração");
        product.setPrice(new BigDecimal(price));
        product.setDiscountPercent(discountPercent);
        product.setDiscountPrice(new BigDecimal(price));
        product.setCategory("prata");
        product.setImageUrl("https://example.test/product.jpg");
        product.setHighlighted(false);
        product.setStockQuantity(stock);
        return productRepository.saveAndFlush(product);
    }

    @Test
    void rejectsInvalidCredentialsAndProtectsAdministrativeEndpoints() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email":"integration@angel.test","password":"wrong-password"}
                    """))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.success").value(false));

        mockMvc.perform(get("/api/pedidos"))
            .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/pedidos")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk());
    }

    @Test
    void updatesStatusAndTrackingWithJwt() throws Exception {
        PurchaseOrder order = new PurchaseOrder();
        order.setNumber("ANG-INTEGRATION-001");
        order.setEmail("cliente@angel.test");
        order.setSubtotal(BigDecimal.TEN);
        order.setShipping(BigDecimal.ZERO);
        order.setTotal(BigDecimal.TEN);
        order.setStatus(Status.PENDENTE);
        order = purchaseOrderRepository.saveAndFlush(order);

        mockMvc.perform(patch("/api/pedidos/{id}/status", order.getId())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"Pago\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("Pago"));

        mockMvc.perform(patch("/api/pedidos/{id}/status", order.getId())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"Pronto para Retirada\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("Pronto para Retirada"));

        mockMvc.perform(patch("/api/pedidos/{id}/tracking-code", order.getId())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"trackingCode\":\"AA123456789BR\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.trackingCode").value("AA123456789BR"));

        PurchaseOrder saved = purchaseOrderRepository.findById(order.getId()).orElseThrow();
        assertThat(saved.getStatus()).isEqualTo(Status.PRONTO_PARA_RETIRADA);
        assertThat(saved.getTrackingCode()).isEqualTo("AA123456789BR");
    }

    @Test
    void updatesAndReadsInstitutionalPolicies() throws Exception {
        mockMvc.perform(put("/api/paginas-institucionais")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "termsContent":"Termos de integração",
                      "exchangesContent":"Trocas de integração",
                      "privacyContent":"Privacidade de integração"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.termsContent").value("Termos de integração"));

        mockMvc.perform(get("/api/paginas-institucionais"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.exchangesContent").value("Trocas de integração"))
            .andExpect(jsonPath("$.privacyContent").value("Privacidade de integração"));
    }

    @Test
    void rejectsUnknownFieldsAndInvalidPayloadWithoutLeakingInternals() throws Exception {
        Product product = product("Produto seguro", "30.00", 0, 2);
        mockMvc.perform(post("/api/pedidos")
                .header("Idempotency-Key", "unknown-field-test-000000001")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "customerName":"A","email":"invalido","phone":"1",
                      "items":[{"productId":"%s","quantity":0,"price":1}],
                      "shippingOption":"retirada","shippingQuoteId":"PICKUP",
                      "payment":"PIX","address":{},"status":"Pago"
                    }
                    """.formatted(product.getId())))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("INVALID_REQUEST"))
            .andExpect(jsonPath("$.correlationId").isNotEmpty())
            .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("PostgreSQL"))));
        assertThat(purchaseOrderRepository.count()).isZero();
    }

    @Test
    void appliesCorsCorrelationAndSecurityHeaders() throws Exception {
        mockMvc.perform(options("/api/produtos")
                .header("Origin", "http://localhost:5173")
                .header("Access-Control-Request-Method", "GET"))
            .andExpect(status().isOk())
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header()
                .string("Access-Control-Allow-Origin", "http://localhost:5173"))
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header()
                .exists("X-Correlation-ID"))
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header()
                .string("X-Frame-Options", "DENY"))
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header()
                .exists("Content-Security-Policy"));
    }

    @Test
    void exposesHealthAndAcceptsOnlyKnownAnonymousFunnelEvents() throws Exception {
        mockMvc.perform(get("/actuator/health"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("UP"));

        mockMvc.perform(post("/api/metricas/funil")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"event\":\"CART_ITEM_ADDED\",\"context\":\"prata\"}"))
            .andExpect(status().isNoContent());

        mockMvc.perform(post("/api/metricas/funil")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"event\":\"CUSTOM_EVENT\",\"email\":\"cliente@example.com\"}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void expiresReservationAndReturnsLastUnitToAvailability() throws Exception {
        Product product = product("Produto expirável", "45.00", 0, 1);
        String body = checkoutBody(product, 1);
        mockMvc.perform(post("/api/pedidos")
                .header("Idempotency-Key", "expiration-test-00000000001")
                .contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isCreated());

        PurchaseOrder order = purchaseOrderRepository.findAll().getFirst();
        order.setReservationExpiresAt(LocalDateTime.now().minusMinutes(1));
        purchaseOrderRepository.saveAndFlush(order);
        inventoryService.expireReservations();

        PurchaseOrder expired = purchaseOrderRepository.findById(order.getId()).orElseThrow();
        Product released = productRepository.findById(product.getId()).orElseThrow();
        assertThat(expired.getStatus()).isEqualTo(Status.CANCELADO);
        assertThat(expired.getInventoryState()).isEqualTo("RELEASED");
        assertThat(released.getReservedQuantity()).isZero();
        assertThat(released.getStockQuantity()).isEqualTo(1);
    }

    @Test
    void concurrentCheckoutsCannotReserveTheLastUnitTwice() throws Exception {
        Product product = product("Última unidade concorrente", "70.00", 0, 1);
        String body = checkoutBody(product, 1);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            Future<Integer> first = executor.submit(() -> concurrentCheckout(body, "concurrent-checkout-key-000001", ready, start));
            Future<Integer> second = executor.submit(() -> concurrentCheckout(body, "concurrent-checkout-key-000002", ready, start));
            ready.await();
            start.countDown();
            List<Integer> statuses = List.of(first.get(), second.get());
            assertThat(statuses).containsExactlyInAnyOrder(201, 409);
        }
        assertThat(purchaseOrderRepository.count()).isEqualTo(1);
        assertThat(productRepository.findById(product.getId()).orElseThrow().getReservedQuantity()).isEqualTo(1);
    }

    private int concurrentCheckout(String body, String key, CountDownLatch ready, CountDownLatch start) throws Exception {
        ready.countDown();
        start.await();
        return mockMvc.perform(post("/api/pedidos")
                .header("Idempotency-Key", key)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andReturn().getResponse().getStatus();
    }

    private String checkoutBody(Product product, int quantity) {
        return """
            {
              "customerName":"Cliente Concorrente","email":"concorrente@example.com","phone":"65999999999",
              "items":[{"productId":"%s","quantity":%d}],
              "shippingOption":"retirada","shippingQuoteId":"PICKUP","payment":"PIX","address":{}
            }
            """.formatted(product.getId(), quantity);
    }
}
