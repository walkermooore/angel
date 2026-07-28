package com.angel.backend.service;

import com.angel.backend.dto.CreateOrderItemRequest;
import com.angel.backend.dto.ShippingQuoteResponse;
import com.angel.backend.exception.CheckoutException;
import com.angel.backend.model.Product;
import com.angel.backend.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import tools.jackson.databind.JsonNode;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class MelhorEnvioService {

    private static final BigDecimal FREE_SHIPPING_THRESHOLD = new BigDecimal("250.00");

    private final ProductRepository productRepository;
    private final RestClient client;
    private final MelhorEnvioOAuthService oauthService;
    private final String originCep;
    private final MeterRegistry meterRegistry;

    public MelhorEnvioService(
        ProductRepository productRepository,
        MelhorEnvioOAuthService oauthService,
        MeterRegistry meterRegistry,
        @Value("${app.melhor-envio.base-url:https://melhorenvio.com.br}") String baseUrl,
        @Value("${app.melhor-envio.user-agent:Angell Joias (contato@example.invalid)}") String userAgent,
        @Value("${app.melhor-envio.origin-cep:78000000}") String originCep
    ) {
        this.productRepository = productRepository;
        this.oauthService = oauthService;
        this.meterRegistry = meterRegistry;
        this.originCep = digits(originCep);
        this.client = RestClient.builder()
            .baseUrl(baseUrl)
            .defaultHeader("Accept", "application/json")
            .defaultHeader("User-Agent", userAgent)
            .build();
    }

    public List<ShippingQuoteResponse> quote(String cep, List<CreateOrderItemRequest> items) {
        Map<UUID, Integer> quantities = aggregate(items);
        Map<UUID, Product> products = productRepository.findAllById(quantities.keySet()).stream()
            .collect(Collectors.toMap(Product::getId, Function.identity()));
        if (products.size() != quantities.size()) {
            throw new CheckoutException(HttpStatus.BAD_REQUEST, "Um ou mais produtos não estão disponíveis.");
        }
        return quote(cep, quantities, products);
    }

    public BigDecimal priceForSelectedQuote(
        String quoteId,
        String cep,
        Map<UUID, Integer> quantities,
        Map<UUID, Product> products
    ) {
        return quote(cep, quantities, products).stream()
            .filter(quote -> quote.id().equals(quoteId))
            .findFirst()
            .map(ShippingQuoteResponse::price)
            .orElseThrow(() -> new CheckoutException(
                HttpStatus.BAD_REQUEST,
                "A cotação de frete expirou ou não está disponível. Calcule o frete novamente."
            ));
    }

    private List<ShippingQuoteResponse> quote(
        String cep,
        Map<UUID, Integer> quantities,
        Map<UUID, Product> products
    ) {
        String destinationCep = digits(cep);
        if (originCep.length() != 8 || destinationCep.length() != 8) {
            throw new CheckoutException(HttpStatus.BAD_REQUEST, "CEP de origem ou destino inválido.");
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        List<Map<String, Object>> shipmentProducts = new ArrayList<>();
        for (Map.Entry<UUID, Integer> entry : quantities.entrySet()) {
            Product product = products.get(entry.getKey());
            validateProduct(product);
            BigDecimal unitPrice = effectivePrice(product);
            subtotal = subtotal.add(unitPrice.multiply(BigDecimal.valueOf(entry.getValue())));
            shipmentProducts.add(Map.of(
                "id", product.getId().toString(),
                "width", product.getWidth(),
                "height", product.getHeight(),
                "length", product.getLength(),
                "weight", product.getWeight(),
                "insurance_value", unitPrice,
                "quantity", entry.getValue()
            ));
        }

        Map<String, Object> payload = Map.of(
            "from", Map.of("postal_code", originCep),
            "to", Map.of("postal_code", destinationCep),
            "products", shipmentProducts,
            "options", Map.of("receipt", false, "own_hand", false)
        );

        try {
            JsonNode response = calculate(payload, oauthService.validAccessToken());
            return parseQuotes(response, subtotal);
        } catch (RestClientResponseException exception) {
            if (exception.getStatusCode().value() == 401) {
                oauthService.forceRefresh();
                try {
                    return parseQuotes(calculate(payload, oauthService.validAccessToken()), subtotal);
                } catch (Exception retryFailure) {
                    throw new CheckoutException(HttpStatus.BAD_GATEWAY,
                        "A autorização do Melhor Envio precisa ser refeita.");
                }
            }
            throw new CheckoutException(
                HttpStatus.BAD_GATEWAY,
                "O Melhor Envio recusou a cotação. Confira o CEP e tente novamente."
            );
        } catch (CheckoutException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new CheckoutException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "O serviço de frete está indisponível no momento. Tente novamente."
            );
        }
    }

    private List<ShippingQuoteResponse> parseQuotes(JsonNode response, BigDecimal subtotal) {
        if (response == null || !response.isArray()) {
            throw new CheckoutException(HttpStatus.BAD_GATEWAY, "Resposta inválida do Melhor Envio.");
        }
        boolean freeShipping = subtotal.compareTo(FREE_SHIPPING_THRESHOLD) >= 0;
        List<ShippingQuoteResponse> quotes = new ArrayList<>();
        for (JsonNode item : response) {
            if (item.hasNonNull("error") || !item.hasNonNull("id")) continue;
            BigDecimal apiPrice = decimal(item, "custom_price", "price");
            if (apiPrice == null) continue;
            JsonNode company = item.path("company");
            quotes.add(new ShippingQuoteResponse(
                "ME-" + item.path("id").asText(),
                item.path("name").asText("Entrega"),
                freeShipping ? BigDecimal.ZERO.setScale(2) : apiPrice.setScale(2, RoundingMode.HALF_UP),
                item.path("custom_delivery_time").asInt(item.path("delivery_time").asInt()),
                company.path("name").asText("Melhor Envio"),
                company.path("picture").asText(null)
            ));
        }
        if (quotes.isEmpty()) {
            throw new CheckoutException(HttpStatus.BAD_GATEWAY, "Nenhuma transportadora atende este CEP.");
        }
        return quotes;
    }

    private BigDecimal decimal(JsonNode item, String preferred, String fallback) {
        String value = item.hasNonNull(preferred) ? item.path(preferred).asText() : item.path(fallback).asText();
        try {
            return new BigDecimal(value);
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private Map<UUID, Integer> aggregate(List<CreateOrderItemRequest> items) {
        Map<UUID, Integer> quantities = new LinkedHashMap<>();
        for (CreateOrderItemRequest item : items) {
            quantities.merge(item.productId(), item.quantity(), Integer::sum);
        }
        return quantities;
    }

    private void validateProduct(Product product) {
        if (product == null || product.getDeletedAt() != null || product.getPrice() == null) {
            throw new CheckoutException(HttpStatus.BAD_REQUEST, "Produto indisponível para cotação.");
        }
        if (product.getWeight() == null || product.getWeight().signum() <= 0
            || product.getHeight() == null || product.getHeight() <= 0
            || product.getWidth() == null || product.getWidth() <= 0
            || product.getLength() == null || product.getLength() <= 0) {
            throw new CheckoutException(HttpStatus.UNPROCESSABLE_ENTITY,
                "O produto " + product.getName() + " ainda não possui peso e dimensões para calcular o frete.");
        }
    }

    private BigDecimal effectivePrice(Product product) {
        BigDecimal price = product.getPrice();
        int discount = product.getDiscountPercent() == null ? 0 : Math.max(0, Math.min(100, product.getDiscountPercent()));
        return price.multiply(BigDecimal.valueOf(100 - discount))
            .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }

    private JsonNode calculate(Map<String, Object> payload, String token) {
        return Timer.builder("angell.external.api.duration")
            .description("Latência das APIs externas")
            .tag("provider", "melhor_envio")
            .tag("operation", "quote")
            .publishPercentileHistogram()
            .register(meterRegistry)
            .record(() -> client.post().uri("/api/v2/me/shipment/calculate")
                .header("Authorization", "Bearer " + token)
                .body(payload).retrieve().body(JsonNode.class));
    }

    private static String digits(String value) {
        return value == null ? "" : value.replaceAll("\\D", "");
    }
}
