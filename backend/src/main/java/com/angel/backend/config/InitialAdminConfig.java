package com.angel.backend.config;

import com.angel.backend.model.AdminUser;
import com.angel.backend.repository.AdminUserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.security.bootstrap-admin-enabled", havingValue = "true")
public class InitialAdminConfig implements ApplicationRunner {

    private final AdminUserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final String email;
    private final String password;
    private final String name;

    public InitialAdminConfig(
        AdminUserRepository repository,
        PasswordEncoder passwordEncoder,
        @Value("${app.security.initial-admin-email:}") String email,
        @Value("${app.security.initial-admin-password:}") String password,
        @Value("${app.security.initial-admin-name:Administrador Angell}") String name
    ) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.email = email == null ? "" : email.trim().toLowerCase();
        this.password = password == null ? "" : password;
        this.name = name;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (email.isBlank() && password.isBlank()) return;
        if (email.isBlank() || password.length() < 12) {
            throw new IllegalStateException(
                "ADMIN_INITIAL_EMAIL e ADMIN_INITIAL_PASSWORD (mínimo 12 caracteres) devem ser informados juntos."
            );
        }

        repository.findByEmailIgnoreCase(email).orElseGet(() ->
            repository.save(new AdminUser(name, email, passwordEncoder.encode(password)))
        );
    }
}
