package com.angel.backend.security;

import com.angel.backend.model.AdminSession;
import com.angel.backend.repository.AdminSessionRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;

@Component
public class AdminSessionFilter extends OncePerRequestFilter {
    private final AdminSessionRepository repository;

    public AdminSessionFilter(AdminSessionRepository repository) {
        this.repository = repository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
        throws ServletException, IOException {
        Authentication authentication = org.springframework.security.core.context.SecurityContextHolder
            .getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Jwt jwt) {
            AdminSession session = repository.findByTokenId(jwt.getId()).orElse(null);
            if (session == null || session.getRevokedAt() != null
                || session.getExpiresAt().isBefore(LocalDateTime.now())) {
                org.springframework.security.core.context.SecurityContextHolder.clearContext();
                chain.doFilter(request, response);
                return;
            }
            if (session.getLastSeenAt() == null || session.getLastSeenAt().isBefore(LocalDateTime.now().minusMinutes(5))) {
                session.setLastSeenAt(LocalDateTime.now());
                repository.save(session);
            }
        }
        chain.doFilter(request, response);
    }
}
