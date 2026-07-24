package com.angel.backend.controller;

import com.angel.backend.dto.LoginRequest;
import com.angel.backend.model.AdminUser;
import com.angel.backend.repository.AdminUserRepository;
import com.angel.backend.service.JwtService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthController(AdminUserRepository adminUserRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.adminUserRepository = adminUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        String email = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";
        String pass = request.getPassword() != null ? request.getPassword().trim() : "";

        Optional<AdminUser> adminOpt = adminUserRepository.findByEmailIgnoreCase(email);
        if (adminOpt.isPresent()) {
            AdminUser user = adminOpt.get();
            if (passwordEncoder.matches(pass, user.getPassword())) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "token", jwtService.createToken(user),
                    "user", Map.of(
                        "id", user.getId(),
                        "name", user.getName(),
                        "email", user.getEmail(),
                        "role", user.getRole()
                    )
                ));
            }
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(Map.of("success", false, "message", "Credenciais inválidas."));
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
}
