package com.angel.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

@Component
public class AdminCsrfFilter extends OncePerRequestFilter {
    private static final Set<String> SAFE = Set.of("GET", "HEAD", "OPTIONS");

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
        throws ServletException, IOException {
        if (SAFE.contains(request.getMethod()) || !hasCookie(request, "ADMIN_SESSION") || isPublicMutation(request)) {
            chain.doFilter(request, response);
            return;
        }
        String cookie = cookieValue(request, "XSRF-TOKEN");
        String header = request.getHeader("X-CSRF-Token");
        if (cookie == null || header == null || !cookie.equals(header)) {
            response.setStatus(403);
            response.setContentType("application/json");
            response.getWriter().write("{\"message\":\"Token CSRF inválido.\"}");
            return;
        }
        chain.doFilter(request, response);
    }

    private boolean isPublicMutation(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.endsWith("/api/auth/login") || path.endsWith("/api/pedidos")
            || path.endsWith("/api/frete/cotacoes") || path.endsWith("/api/pedidos/acompanhar")
            || path.endsWith("/api/pos-venda") || path.endsWith("/api/pos-venda/anexos");
    }

    private boolean hasCookie(HttpServletRequest request, String name) {
        return cookieValue(request, name) != null;
    }

    private String cookieValue(HttpServletRequest request, String name) {
        if (request.getCookies() == null) return null;
        for (Cookie cookie : request.getCookies()) if (name.equals(cookie.getName())) return cookie.getValue();
        return null;
    }
}
