package com.angel.backend.config;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.oauth2.server.resource.web.DefaultBearerTokenResolver;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.security.web.header.writers.StaticHeadersWriter;
import com.angel.backend.security.ApiRateLimitFilter;
import com.angel.backend.security.AdminCsrfFilter;
import com.angel.backend.security.AdminSessionFilter;
import jakarta.servlet.http.Cookie;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

@Configuration
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, ApiRateLimitFilter rateLimitFilter,
                                            AdminCsrfFilter csrfFilter,
                                            AdminSessionFilter sessionFilter,
                                            @Value("${app.security.require-https:false}") boolean requireHttps)
        throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> {})
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/auth/logout", "/api/pedidos", "/api/frete/cotacoes",
                    "/api/pedidos/acompanhar", "/api/metricas/funil",
                    "/api/pos-venda", "/api/pos-venda/anexos",
                    "/api/pagamentos/infinitepay/checkout", "/api/pagamentos/infinitepay/webhook").permitAll()
                .requestMatchers(HttpMethod.GET, "/actuator/health", "/actuator/health/**").permitAll()
                .requestMatchers(HttpMethod.GET,
                    "/api/produtos", "/api/categorias", "/api/destaques", "/api/faq",
                    "/api/home-settings", "/api/sobre-nos", "/api/paginas-institucionais"
                ).permitAll()
                .requestMatchers(HttpMethod.GET, "/api/produtos/*").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/pos-venda/acompanhar").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/media/images/*").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/pagamentos/infinitepay/status").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/frete/oauth/callback").permitAll()
                .requestMatchers("/error").permitAll()
                .anyRequest().hasAuthority("SCOPE_ADMIN")
            )
            .oauth2ResourceServer(oauth -> oauth
                .bearerTokenResolver(cookieBearerTokenResolver())
                .jwt(jwt -> {}))
            .headers(headers -> headers
                .contentSecurityPolicy(csp -> csp.policyDirectives(
                    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"))
                .frameOptions(frame -> frame.deny())
                .referrerPolicy(referrer -> referrer.policy(
                    ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                .httpStrictTransportSecurity(hsts -> hsts
                    .includeSubDomains(true)
                    .preload(true)
                    .maxAgeInSeconds(31_536_000))
                .addHeaderWriter(new StaticHeadersWriter(
                    "Permissions-Policy",
                    "camera=(), microphone=(), geolocation=(), payment=(), usb=()"))
                .addHeaderWriter(new StaticHeadersWriter(
                    "Cross-Origin-Resource-Policy", "same-site")))
            .addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterAfter(csrfFilter, ApiRateLimitFilter.class)
            .addFilterAfter(sessionFilter, org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter.class);
        if (requireHttps) {
            http.redirectToHttps(https -> {});
        }
        return http.build();
    }

    @Bean
    BearerTokenResolver cookieBearerTokenResolver() {
        DefaultBearerTokenResolver headerResolver = new DefaultBearerTokenResolver();
        return request -> {
            String headerToken = headerResolver.resolve(request);
            if (headerToken != null) return headerToken;
            if (request.getCookies() != null) {
                for (Cookie cookie : request.getCookies()) {
                    if ("ADMIN_SESSION".equals(cookie.getName())) return cookie.getValue();
                }
            }
            return null;
        };
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    SecretKey jwtSecretKey(@Value("${app.security.jwt-secret}") String secret) {
        if (secret == null || secret.length() < 32) {
            throw new IllegalStateException("JWT_SECRET deve conter pelo menos 32 caracteres.");
        }
        return new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    }

    @Bean
    JwtDecoder jwtDecoder(SecretKey secretKey) {
        return NimbusJwtDecoder.withSecretKey(secretKey).build();
    }

    @Bean
    JwtEncoder jwtEncoder(SecretKey secretKey) {
        return new NimbusJwtEncoder(new ImmutableSecret<>(secretKey));
    }
}
