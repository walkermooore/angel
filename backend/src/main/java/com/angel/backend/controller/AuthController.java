package com.angel.backend.controller;

import com.angel.backend.dto.LoginRequest;
import com.angel.backend.model.AdminUser;
import com.angel.backend.repository.AdminUserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AdminUserRepository adminUserRepository;

    public AuthController(AdminUserRepository adminUserRepository) {
        this.adminUserRepository = adminUserRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        String email = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";
        String pass = request.getPassword() != null ? request.getPassword().trim() : "";

        Optional<AdminUser> adminOpt = adminUserRepository.findByEmailIgnoreCase(email);
        if (adminOpt.isPresent()) {
            AdminUser user = adminOpt.get();
            if (user.getPassword().equals(pass)) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "token", "angel-token-" + user.getId(),
                    "user", Map.of(
                        "id", user.getId(),
                        "name", user.getName(),
                        "email", user.getEmail(),
                        "role", user.getRole()
                    )
                ));
            }
        }

        // Fallback for default demo credential if DB not yet seeded
        if ("admin@example.invalid".equalsIgnoreCase(email) && "admin123".equals(pass)) {
            return ResponseEntity.ok(Map.of(
                "success", true,
                "token", "angel-admin-token-12345",
                "user", Map.of("email", "admin@example.invalid", "role", "ADMIN")
            ));
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(Map.of("success", false, "message", "Credenciais inválidas."));
    }

    @GetMapping("/me")
    public ResponseEntity<?> currentAdmin() {
        return adminUserRepository.findByEmailIgnoreCase("admin@example.invalid")
            .map(u -> ResponseEntity.ok(Map.of(
                "id", u.getId(),
                "name", u.getName(),
                "email", u.getEmail(),
                "role", u.getRole()
            )))
            .orElseGet(() -> ResponseEntity.ok(Map.of(
                "name", "Administradora Angel",
                "email", "admin@example.invalid",
                "role", "ADMIN"
            )));
    }
}
