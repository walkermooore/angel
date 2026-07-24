package com.angel.backend.controller;

import com.angel.backend.dto.LoginRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final String ADMIN_EMAIL = "admin@example.invalid";
    private static final String ADMIN_PASS = "admin123";

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        String email = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";
        String pass = request.getPassword() != null ? request.getPassword().trim() : "";

        if (ADMIN_EMAIL.equalsIgnoreCase(email) && ADMIN_PASS.equals(pass)) {
            return ResponseEntity.ok(Map.of(
                "success", true,
                "token", "angel-admin-token-12345",
                "user", Map.of("email", ADMIN_EMAIL, "role", "ADMIN")
            ));
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(Map.of("success", false, "message", "Credenciais inválidas."));
    }
}
