package com.angel.backend.config;

import com.angel.backend.repository.AboutSettingsRepository;
import com.angel.backend.repository.HomeSettingsRepository;
import com.angel.backend.repository.ProductRepository;
import com.angel.backend.service.ImageStorageService;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class LegacyImageMigration {
    private final ProductRepository products;
    private final HomeSettingsRepository home;
    private final AboutSettingsRepository about;
    private final ImageStorageService storage;

    public LegacyImageMigration(ProductRepository products, HomeSettingsRepository home,
                                AboutSettingsRepository about, ImageStorageService storage) {
        this.products = products;
        this.home = home;
        this.about = about;
        this.storage = storage;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void migrate() {
        products.findAll().stream()
            .filter(product -> isDataUrl(product.getImageUrl()))
            .forEach(product -> product.setImageUrl(storage.migrateDataUrl(product.getImageUrl())));
        home.findById(1L).filter(settings -> isDataUrl(settings.getHeroImage()))
            .ifPresent(settings -> settings.setHeroImage(storage.migrateDataUrl(settings.getHeroImage())));
        about.findById(1L).filter(settings -> isDataUrl(settings.getImageUrl()))
            .ifPresent(settings -> settings.setImageUrl(storage.migrateDataUrl(settings.getImageUrl())));
    }

    private boolean isDataUrl(String value) {
        return value != null && value.startsWith("data:image/");
    }
}
