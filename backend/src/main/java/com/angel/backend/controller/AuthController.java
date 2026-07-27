package com.angel.backend.controller;

import com.angel.backend.dto.LoginRequest;
import com.angel.backend.model.AdminUser;
import com.angel.backend.repository.AdminUserRepository;
import com.angel.backend.service.JwtService;
import com.angel.backend.service.LoginProtectionService;
import com.angel.backend.repository.AuditLogRepository;
import com.angel.backend.model.AuditLog;
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
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final LoginProtectionService loginProtectionService;
    private final AuditLogRepository auditLogRepository;
    private final boolean secureCookies;

    public AuthController(AdminUserRepository adminUserRepository, PasswordEncoder passwordEncoder, JwtService jwtService,
                          LoginProtectionService loginProtectionService, AuditLogRepository auditLogRepository,
                          @Value("${app.security.secure-cookies:false}") boolean secureCookies) {
        this.adminUserRepository = adminUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.loginProtectionService = loginProtectionService;
        this.auditLogRepository = auditLogRepository;
        this.secureCookies = secureCookies;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request, HttpServletRequest servletRequest) {
        String email = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";
        String pass = request.getPassword() != null ? request.getPassword().trim() : "";
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
                loginProtectionService.success(email, ip);
                String token = jwtService.createToken(user);
                String csrfToken = UUID.randomUUID().toString();
                auditLogRepository.save(new AuditLog("SECURITY", "Login administrativo", user.getEmail(),
                    "Novo acesso administrativo. IP: " + ip));
                return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE,
                        ResponseCookie.from("ADMIN_SESSION", token).httpOnly(true).secure(secureCookies)
                            .sameSite("Strict").path("/api").maxAge(Duration.ofHours(8)).build().toString(),
                        ResponseCookie.from("XSRF-TOKEN", csrfToken).httpOnly(false).secure(secureCookies)
                            .sameSite("Strict").path("/api").maxAge(Duration.ofHours(8)).build().toString())
                    .body(Map.of(
                    "success", true,
                    "token", token,
                    "csrfToken", csrfToken,
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
    public ResponseEntity<?> logout() {
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
                "role", u.getRole()
            )))
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        return forwarded == null || forwarded.isBlank() ? request.getRemoteAddr() : forwarded.split(",")[0].trim();
    }
}
