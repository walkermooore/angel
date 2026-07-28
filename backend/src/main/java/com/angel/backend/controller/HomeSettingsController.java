package com.angel.backend.controller;

import com.angel.backend.model.HomeSettings;
import com.angel.backend.repository.HomeSettingsRepository;
import org.springframework.web.bind.annotation.*;
import com.angel.backend.service.ImageStorageService;

import java.util.List;

@RestController
@RequestMapping("/api/home-settings")
public class HomeSettingsController {

    private final HomeSettingsRepository homeSettingsRepository;
    private final ImageStorageService imageStorage;

    public HomeSettingsController(HomeSettingsRepository homeSettingsRepository, ImageStorageService imageStorage) {
        this.homeSettingsRepository = homeSettingsRepository;
        this.imageStorage = imageStorage;
    }

    @GetMapping
    public HomeSettings obterConfiguracoes() {
        return homeSettingsRepository.findById(1L).orElseGet(() -> {
            HomeSettings defaultSettings = new HomeSettings();
            defaultSettings.setId(1L);
            defaultSettings.setHeroTitle("Sofisticação em cada detalhe.");
            defaultSettings.setHeroDescription("Joias autênticas em Prata 925 e cosméticos selecionados com excelência para exaltar sua beleza singular.");
            defaultSettings.setHeroImage("https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=1200&auto=format&fit=crop");
            defaultSettings.setValues(List.of(
                new HomeSettings.ValueItem("1", "Prata 925", "Certificada e Vitalícia"),
                new HomeSettings.ValueItem("2", "Frete Seguro", "Para todo o Brasil"),
                new HomeSettings.ValueItem("3", "Pagamento Facilitado", "Até 6x Sem Juros"),
                new HomeSettings.ValueItem("4", "Atendimento Exclusivo", "Suporte via WhatsApp")
            ));
            defaultSettings.setHighlightIds(List.of());
            return homeSettingsRepository.save(defaultSettings);
        });
    }

    @PutMapping
    public HomeSettings atualizarConfiguracoes(@RequestBody HomeSettings settings) {
        imageStorage.validateReference(settings.getHeroImage());
        settings.setId(1L);
        return homeSettingsRepository.save(settings);
    }
}
