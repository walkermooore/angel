package com.angel.backend.config;

import com.angel.backend.model.AboutSettings;
import com.angel.backend.model.AdminUser;
import com.angel.backend.model.CategoryEntity;
import com.angel.backend.model.Product;
import com.angel.backend.repository.AboutSettingsRepository;
import com.angel.backend.repository.AdminUserRepository;
import com.angel.backend.repository.CategoryRepository;
import com.angel.backend.repository.ProductRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final AdminUserRepository adminUserRepository;
    private final AboutSettingsRepository aboutSettingsRepository;

    public DataInitializer(ProductRepository productRepository, CategoryRepository categoryRepository, AdminUserRepository adminUserRepository, AboutSettingsRepository aboutSettingsRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.adminUserRepository = adminUserRepository;
        this.aboutSettingsRepository = aboutSettingsRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        // Seed Admin Account
        if (adminUserRepository.count() == 0) {
            adminUserRepository.save(new AdminUser("Administradora Angel", "admin@example.invalid", "admin123"));
        }

        // Seed Categories
        if (categoryRepository.count() == 0) {
            categoryRepository.save(new CategoryEntity("prata"));
            categoryRepository.save(new CategoryEntity("cosmeticos"));
        }

        // Seed About Settings
        if (aboutSettingsRepository.count() == 0) {
            aboutSettingsRepository.save(new AboutSettings());
        }

        // Seed Products in PostgreSQL database automatically
        if (productRepository.count() == 0) {
            productRepository.saveAll(List.of(
                new Product(
                    "Colar Éclat Prata 925",
                    "Colar com ponto de luz em zircônia e corrente veneziana delicada.",
                    new BigDecimal("189.00"),
                    10,
                    new BigDecimal("170.10"),
                    "prata",
                    "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=800&auto=format&fit=crop"
                ),
                new Product(
                    "Brinco Solitário Zircônia",
                    "Par de brincos clássicos com zircônia redonda em tarraxa baby.",
                    new BigDecimal("89.00"),
                    0,
                    new BigDecimal("89.00"),
                    "prata",
                    "https://images.unsplash.com/photo-1630019852942-f89202989a59?q=80&w=800&auto=format&fit=crop"
                ),
                new Product(
                    "Anel Solitário Princess",
                    "Anel delicado em Prata 925 com pedra central cravada a mão.",
                    new BigDecimal("149.00"),
                    15,
                    new BigDecimal("126.65"),
                    "prata",
                    "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=800&auto=format&fit=crop"
                ),
                new Product(
                    "Sérum Radiance Angel",
                    "Sérum facial Iluminador com Ácido Hialurônico e Vitamina C pura.",
                    new BigDecimal("179.00"),
                    0,
                    new BigDecimal("179.00"),
                    "cosmeticos",
                    "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800&auto=format&fit=crop"
                )
            ));
        }
    }
}
