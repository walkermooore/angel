package com.angel.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class ApiRateLimitFilter extends OncePerRequestFilter {
    private final Map<String, Window> windows = new ConcurrentHashMap<>();
    private final boolean enabled;

    public ApiRateLimitFilter(@Value("${app.rate-limit.enabled:true}") boolean enabled) {
        this.enabled = enabled;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !enabled;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
        throws ServletException, IOException {
        Limit limit = limitFor(request);
        if (limit == null) {
            chain.doFilter(request, response);
            return;
        }
        String ip = clientIp(request);
        String key = ip + ":" + request.getMethod() + ":" + limit.bucket;
        long now = Instant.now().getEpochSecond();
        Window window = windows.compute(key, (ignored, current) -> {
            if (current == null || now - current.startedAt >= limit.windowSeconds) return new Window(now);
            current.count.incrementAndGet();
            return current;
        });
        if (window.count.get() > limit.maximum) {
            response.setStatus(429);
            response.setContentType("application/json");
            response.setHeader("Retry-After", String.valueOf(limit.windowSeconds));
            response.getWriter().write("{\"message\":\"Muitas requisições. Tente novamente mais tarde.\"}");
            return;
        }
        response.setHeader("X-RateLimit-Limit", String.valueOf(limit.maximum));
        chain.doFilter(request, response);
    }

    private Limit limitFor(HttpServletRequest request) {
        String path = request.getRequestURI();
        String method = request.getMethod();
        if ("POST".equals(method) && path.endsWith("/api/auth/login")) return new Limit("login", 10, 900);
        if ("POST".equals(method) && path.endsWith("/api/pedidos")) return new Limit("checkout", 20, 3600);
        if ("POST".equals(method) && path.endsWith("/api/frete/cotacoes")) return new Limit("freight", 60, 60);
        if ("POST".equals(method) && path.endsWith("/api/pedidos/acompanhar")) return new Limit("tracking", 10, 600);
        if (path.startsWith("/api/") && ("GET".equals(method) || "POST".equals(method))) {
            return new Limit("public-api", 120, 60);
        }
        return null;
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        return forwarded == null || forwarded.isBlank() ? request.getRemoteAddr() : forwarded.split(",")[0].trim();
    }

    private record Limit(String bucket, int maximum, long windowSeconds) {}
    private static final class Window {
        private final long startedAt;
        private final AtomicInteger count = new AtomicInteger(1);
        private Window(long startedAt) { this.startedAt = startedAt; }
    }
}
