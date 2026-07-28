package com.angel.backend.controller;

import com.angel.backend.dto.LoginRequest;
import com.angel.backend.model.AdminUser;
import com.angel.backend.repository.AdminUserRepository;
import com.angel.backend.service.JwtService;
import com.angel.backend.service.LoginProtectionService;
import com.angel.backend.service.SecretEncryptionService;
import com.angel.backend.service.TotpService;
import com.angel.backend.repository.AuditLogRepository;
import com.angel.backend.repository.AdminSessionRepository;
import com.angel.backend.model.AuditLog;
import com.angel.backend.model.AdminSession;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.beans.factory.annotation.Value;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final LoginProtectionService loginProtectionService;
    private final AuditLogRepository auditLogRepository;
    private final AdminSessionRepository sessionRepository;
    private final TotpService totpService;
    private final SecretEncryptionService encryption;
    private final boolean secureCookies;

    public AuthController(AdminUserRepository adminUserRepository, PasswordEncoder passwordEncoder, JwtService jwtService,
                          LoginProtectionService loginProtectionService, AuditLogRepository auditLogRepository,
                          AdminSessionRepository sessionRepository, TotpService totpService,
                          SecretEncryptionService encryption,
                          @Value("${app.security.secure-cookies:false}") boolean secureCookies) {
        this.adminUserRepository = adminUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.loginProtectionService = loginProtectionService;
        this.auditLogRepository = auditLogRepository;
        this.sessionRepository = sessionRepository;
        this.totpService = totpService;
        this.encryption = encryption;
        this.secureCookies = secureCookies;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request, HttpServletRequest servletRequest) {
        String email = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";
        String pass = request.getPassword() != null ? request.getPassword() : "";
        String ip = clientIp(servletRequest);
        long retryAfter = loginProtectionService.retryAfter(email, ip);
        if (retryAfter > 0) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .header("Retry-After", String.valueOf(retryAfter))
                .body(Map.of("success", false, "message", "Acesso temporariamente bloqueado. Tente novamente mais tarde."));
        }

        Optional<AdminUser> adminOpt = adminUserRepository.findByEmailIgnoreCase(email);
        if (adminOpt.isPresent()) {
            AdminUser user = adminOpt.get();
            if (passwordEncoder.matches(pass, user.getPassword())) {
                if (user.isTwoFactorEnabled()) {
                    String secret = encryption.decrypt(user.getTwoFactorSecret());
                    if (!totpService.verify(secret, request.getTotpCode())) {
                        if (request.getTotpCode() != null && !request.getTotpCode().isBlank()) {
                            loginProtectionService.failure(email, ip);
                            auditLogRepository.save(new AuditLog("SECURITY", "Falha de 2FA", email,
                                "Código de autenticação inválido. IP: " + ip));
                        }
                        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                            "success", false,
                            "requiresTwoFactor", true,
                            "message", request.getTotpCode() == null ? "Informe o código de autenticação."
                                : "Código de autenticação inválido."
                        ));
                    }
                }
                loginProtectionService.success(email, ip);
                JwtService.IssuedToken token = jwtService.createToken(user);
                String csrfToken = UUID.randomUUID().toString();
                sessionRepository.save(new AdminSession(
                    user,
                    token.id(),
                    LocalDateTime.ofInstant(token.expiresAt(), ZoneId.systemDefault()),
                    ip,
                    servletRequest.getHeader("User-Agent")
                ));
                auditLogRepository.save(new AuditLog("SECURITY", "Login administrativo", user.getEmail(),
                    "Novo acesso administrativo. IP: " + ip));
                return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE,
                        ResponseCookie.from("ADMIN_SESSION", token.value()).httpOnly(true).secure(secureCookies)
                            .sameSite("Strict").path("/api").maxAge(Duration.ofHours(8)).build().toString(),
                        ResponseCookie.from("XSRF-TOKEN", csrfToken).httpOnly(false).secure(secureCookies)
                            .sameSite("Strict").path("/api").maxAge(Duration.ofHours(8)).build().toString())
                    .body(Map.of(
                    "success", true,
                    "csrfToken", csrfToken,
                    "twoFactorEnabled", user.isTwoFactorEnabled(),
                    "user", Map.of(
                        "id", user.getId(),
                        "name", user.getName(),
                        "email", user.getEmail(),
                        "role", user.getRole()
                    )
                ));
            }
        }

        loginProtectionService.failure(email, ip);
        auditLogRepository.save(new AuditLog("SECURITY", "Falha de login", email,
            "Credenciais inválidas. IP: " + ip));
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(Map.of("success", false, "message", "Credenciais inválidas."));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@AuthenticationPrincipal Jwt jwt) {
        if (jwt != null) sessionRepository.findByTokenId(jwt.getId()).ifPresent(session -> {
            session.setRevokedAt(LocalDateTime.now());
            sessionRepository.save(session);
        });
        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE,
                ResponseCookie.from("ADMIN_SESSION", "").httpOnly(true).secure(secureCookies)
                    .sameSite("Strict").path("/api").maxAge(0).build().toString(),
                ResponseCookie.from("XSRF-TOKEN", "").sameSite("Strict").path("/api").maxAge(0).build().toString())
            .body(Map.of("success", true));
    }

    @GetMapping("/me")
    public ResponseEntity<?> currentAdmin(@AuthenticationPrincipal Jwt jwt) {
        return adminUserRepository.findByEmailIgnoreCase(jwt.getSubject())
            .map(u -> ResponseEntity.ok(Map.of(
                "id", u.getId(),
                "name", u.getName(),
                "email", u.getEmail(),
                "role", u.getRole(),
                "twoFactorEnabled", u.isTwoFactorEnabled()
            )))
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/2fa/setup")
    public ResponseEntity<?> setupTwoFactor(@AuthenticationPrincipal Jwt jwt) {
        AdminUser user = currentUser(jwt);
        if (user.isTwoFactorEnabled()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("message", "A autenticação em duas etapas já está ativa."));
        }
        String secret = totpService.generateSecret();
        user.setPendingTwoFactorSecret(encryption.encrypt(secret));
        adminUserRepository.save(user);
        return ResponseEntity.ok(Map.of(
            "secret", secret,
            "provisioningUri", totpService.provisioningUri(secret, user.getEmail())
        ));
    }

    @PostMapping("/2fa/confirm")
    public ResponseEntity<?> confirmTwoFactor(@AuthenticationPrincipal Jwt jwt,
                                               @RequestBody Map<String, String> body) {
        AdminUser user = currentUser(jwt);
        if (user.getPendingTwoFactorSecret() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Inicie a configuração do 2FA primeiro."));
        }
        String secret = encryption.decrypt(user.getPendingTwoFactorSecret());
        if (!totpService.verify(secret, body.get("code"))) {
            return ResponseEntity.badRequest().body(Map.of("message", "Código de autenticação inválido."));
        }
        user.setTwoFactorSecret(user.getPendingTwoFactorSecret());
        user.setPendingTwoFactorSecret(null);
        user.setTwoFactorEnabled(true);
        adminUserRepository.save(user);
        auditLogRepository.save(new AuditLog("SECURITY", "2FA ativado", user.getEmail(),
            "Autenticação em duas etapas ativada."));
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/2fa/disable")
    public ResponseEntity<?> disableTwoFactor(@AuthenticationPrincipal Jwt jwt,
                                               @RequestBody Map<String, String> body) {
        AdminUser user = currentUser(jwt);
        if (!passwordEncoder.matches(body.getOrDefault("password", ""), user.getPassword())
            || !totpService.verify(encryption.decrypt(user.getTwoFactorSecret()), body.get("code"))) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Senha ou código de autenticação inválido."));
        }
        user.setTwoFactorEnabled(false);
        user.setTwoFactorSecret(null);
        user.setPendingTwoFactorSecret(null);
        adminUserRepository.save(user);
        auditLogRepository.save(new AuditLog("SECURITY", "2FA desativado", user.getEmail(),
            "Autenticação em duas etapas desativada."));
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/sessions")
    public List<Map<String, Object>> sessions(@AuthenticationPrincipal Jwt jwt) {
        AdminUser user = currentUser(jwt);
        String currentId = jwt.getId();
        return sessionRepository.findByAdminUserIdOrderByCreatedAtDesc(user.getId()).stream()
            .map(session -> Map.<String, Object>of(
                "id", session.getId(),
                "createdAt", session.getCreatedAt(),
                "lastSeenAt", session.getLastSeenAt(),
                "expiresAt", session.getExpiresAt(),
                "ipAddress", session.getIpAddress() == null ? "" : session.getIpAddress(),
                "userAgent", session.getUserAgent() == null ? "" : session.getUserAgent(),
                "revoked", session.getRevokedAt() != null,
                "current", session.getTokenId().equals(currentId)
            )).toList();
    }

    @DeleteMapping("/sessions/{id}")
    public ResponseEntity<?> revokeSession(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        AdminUser user = currentUser(jwt);
        AdminSession session = sessionRepository.findById(id).orElse(null);
        if (session == null || !session.getAdminUser().getId().equals(user.getId())) {
            return ResponseEntity.notFound().build();
        }
        session.setRevokedAt(LocalDateTime.now());
        sessionRepository.save(session);
        auditLogRepository.save(new AuditLog("SECURITY", "Sessão revogada", user.getEmail(),
            "Sessão administrativa revogada: " + id));
        return ResponseEntity.ok(Map.of("success", true, "current", session.getTokenId().equals(jwt.getId())));
    }

    @PostMapping("/sessions/revoke-others")
    public ResponseEntity<?> revokeOtherSessions(@AuthenticationPrincipal Jwt jwt) {
        AdminUser user = currentUser(jwt);
        sessionRepository.findByAdminUserIdOrderByCreatedAtDesc(user.getId()).stream()
            .filter(session -> !session.getTokenId().equals(jwt.getId()) && session.getRevokedAt() == null)
            .forEach(session -> {
                session.setRevokedAt(LocalDateTime.now());
                sessionRepository.save(session);
            });
        auditLogRepository.save(new AuditLog("SECURITY", "Sessões revogadas", user.getEmail(),
            "Todas as outras sessões administrativas foram revogadas."));
        return ResponseEntity.ok(Map.of("success", true));
    }

    private AdminUser currentUser(Jwt jwt) {
        return adminUserRepository.findByEmailIgnoreCase(jwt.getSubject())
            .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                HttpStatus.UNAUTHORIZED, "Administrador não encontrado."));
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        return forwarded == null || forwarded.isBlank() ? request.getRemoteAddr() : forwarded.split(",")[0].trim();
    }
}
