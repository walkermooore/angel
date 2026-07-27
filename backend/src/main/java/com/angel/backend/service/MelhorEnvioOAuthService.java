package com.angel.backend.service;

import com.angel.backend.exception.CheckoutException;
import com.angel.backend.model.MelhorEnvioCredential;
import com.angel.backend.repository.MelhorEnvioCredentialRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class MelhorEnvioOAuthService {
    private final MelhorEnvioCredentialRepository repository;
    private final SecretEncryptionService encryption;
    private final RestClient client;
    private final String baseUrl;
    private final String clientId;
    private final String clientSecret;
    private final String redirectUri;
    private final Map<String, LocalDateTime> states = new ConcurrentHashMap<>();

    public MelhorEnvioOAuthService(MelhorEnvioCredentialRepository repository, SecretEncryptionService encryption,
        @Value("${app.melhor-envio.base-url}") String baseUrl,
        @Value("${app.melhor-envio.client-id:}") String clientId,
        @Value("${app.melhor-envio.client-secret:}") String clientSecret,
        @Value("${app.melhor-envio.redirect-uri:}") String redirectUri,
        @Value("${app.melhor-envio.user-agent}") String userAgent) {
        this.repository = repository;
        this.encryption = encryption;
        this.baseUrl = baseUrl;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.redirectUri = redirectUri;
        this.client = RestClient.builder().baseUrl(baseUrl)
            .defaultHeader("Accept", "application/json").defaultHeader("User-Agent", userAgent).build();
    }

    public String authorizationUrl() {
        ensureAppConfigured();
        String state = UUID.randomUUID().toString();
        states.put(state, LocalDateTime.now().plusMinutes(10));
        return baseUrl + "/oauth/authorize?response_type=code&client_id=" + encode(clientId)
            + "&redirect_uri=" + encode(redirectUri) + "&state=" + encode(state);
    }

    public void exchangeAuthorizationCode(String code, String state) {
        LocalDateTime expiration = states.remove(state);
        if (expiration == null || expiration.isBefore(LocalDateTime.now())) {
            throw new CheckoutException(HttpStatus.BAD_REQUEST, "Estado OAuth inválido ou expirado.");
        }
        exchange(Map.of("grant_type", "authorization_code", "client_id", clientId,
            "client_secret", clientSecret, "redirect_uri", redirectUri, "code", code));
    }

    public synchronized String validAccessToken() {
        MelhorEnvioCredential credential = repository.findById(1L).orElseThrow(() ->
            new CheckoutException(HttpStatus.SERVICE_UNAVAILABLE,
                "O Melhor Envio ainda não foi autorizado no painel administrativo."));
        if (!environment().equals(credential.getEnvironment())) {
            throw new CheckoutException(HttpStatus.SERVICE_UNAVAILABLE,
                "As credenciais do Melhor Envio pertencem a outro ambiente.");
        }
        if (credential.getAccessExpiresAt().isBefore(LocalDateTime.now().plusMinutes(5))) refresh(credential);
        return encryption.decrypt(repository.findById(1L).orElseThrow().getAccessToken());
    }

    @Transactional
    public void forceRefresh() {
        refresh(repository.findById(1L).orElseThrow(() ->
            new CheckoutException(HttpStatus.UNAUTHORIZED, "Credencial do Melhor Envio inexistente.")));
    }

    private void refresh(MelhorEnvioCredential credential) {
        if (credential.getRefreshExpiresAt().isBefore(LocalDateTime.now())) {
            throw new CheckoutException(HttpStatus.UNAUTHORIZED,
                "A autorização do Melhor Envio expirou. Autorize novamente.");
        }
        exchange(Map.of("grant_type", "refresh_token", "client_id", clientId,
            "client_secret", clientSecret, "refresh_token", encryption.decrypt(credential.getRefreshToken())));
    }

    private void exchange(Map<String, Object> payload) {
        ensureAppConfigured();
        try {
            JsonNode response = client.post().uri("/oauth/token")
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .body(payload).retrieve().body(JsonNode.class);
            if (response == null || !response.hasNonNull("access_token") || !response.hasNonNull("refresh_token")) {
                throw new IllegalStateException("Resposta OAuth incompleta");
            }
            long expiresIn = response.path("expires_in").asLong(2592000);
            MelhorEnvioCredential credential = repository.findById(1L).orElseGet(MelhorEnvioCredential::new);
            credential.setAccessToken(encryption.encrypt(response.path("access_token").asText()));
            credential.setRefreshToken(encryption.encrypt(response.path("refresh_token").asText()));
            credential.setTokenType(response.path("token_type").asText("Bearer"));
            credential.setAccessExpiresAt(LocalDateTime.now().plusSeconds(expiresIn));
            credential.setRefreshExpiresAt(LocalDateTime.now().plusDays(45));
            credential.setEnvironment(environment());
            credential.setUpdatedAt(LocalDateTime.now());
            repository.save(credential);
        } catch (CheckoutException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new CheckoutException(HttpStatus.BAD_GATEWAY,
                "Não foi possível obter ou renovar o token do Melhor Envio.");
        }
    }

    private void ensureAppConfigured() {
        if (clientId.isBlank() || clientSecret.isBlank() || redirectUri.isBlank()) {
            throw new CheckoutException(HttpStatus.SERVICE_UNAVAILABLE,
                "Configure client_id, client_secret e redirect_uri do Melhor Envio.");
        }
    }

    private String environment() { return baseUrl.contains("sandbox") ? "SANDBOX" : "PRODUCTION"; }
    private String encode(String value) { return URLEncoder.encode(value, StandardCharsets.UTF_8); }
}
