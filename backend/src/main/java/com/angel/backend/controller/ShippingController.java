package com.angel.backend.controller;

import com.angel.backend.dto.ShippingQuoteRequest;
import com.angel.backend.dto.ShippingQuoteResponse;
import com.angel.backend.service.MelhorEnvioService;
import com.angel.backend.service.MelhorEnvioOAuthService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import java.util.Map;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/frete")
public class ShippingController {

    private final MelhorEnvioService melhorEnvioService;
    private final MelhorEnvioOAuthService oauthService;

    public ShippingController(MelhorEnvioService melhorEnvioService, MelhorEnvioOAuthService oauthService) {
        this.melhorEnvioService = melhorEnvioService;
        this.oauthService = oauthService;
    }

    @PostMapping("/cotacoes")
    public List<ShippingQuoteResponse> quote(@Valid @RequestBody ShippingQuoteRequest request) {
        return melhorEnvioService.quote(request.cep(), request.items());
    }

    @GetMapping("/oauth/authorization-url")
    public Map<String, String> authorizationUrl() {
        return Map.of("url", oauthService.authorizationUrl());
    }

    @GetMapping("/oauth/callback")
    public Map<String, String> callback(@RequestParam String code, @RequestParam String state) {
        oauthService.exchangeAuthorizationCode(code, state);
        return Map.of("message", "Melhor Envio autorizado com sucesso. Você pode fechar esta página.");
    }
}
