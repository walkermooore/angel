package com.angel.backend.controller;

import com.angel.backend.model.AboutSettings;
import com.angel.backend.repository.AboutSettingsRepository;
import org.springframework.web.bind.annotation.*;
import com.angel.backend.service.ImageStorageService;

@RestController
@RequestMapping("/api/sobre-nos")
public class AboutSettingsController {

    private final AboutSettingsRepository repository;
    private final ImageStorageService imageStorage;

    public AboutSettingsController(AboutSettingsRepository repository, ImageStorageService imageStorage) {
        this.repository = repository;
        this.imageStorage = imageStorage;
    }

    @GetMapping
    public AboutSettings getAboutSettings() {
        return repository.findById(1L).orElseGet(() -> repository.save(new AboutSettings()));
    }

    @PutMapping
    public AboutSettings updateAboutSettings(@RequestBody AboutSettings request) {
        AboutSettings current = repository.findById(1L).orElseGet(AboutSettings::new);
        current.setId(1L);
        if (request.getSubtitle() != null) current.setSubtitle(request.getSubtitle());
        if (request.getTitle() != null) current.setTitle(request.getTitle());
        if (request.getImageUrl() != null) {
            if (!request.getImageUrl().equals(current.getImageUrl())) imageStorage.validateReference(request.getImageUrl());
            current.setImageUrl(request.getImageUrl());
        }
        if (request.getParagraph1() != null) current.setParagraph1(request.getParagraph1());
        if (request.getParagraph2() != null) current.setParagraph2(request.getParagraph2());
        if (request.getParagraph3() != null) current.setParagraph3(request.getParagraph3());
        if (request.getStat1Number() != null) current.setStat1Number(request.getStat1Number());
        if (request.getStat1Label() != null) current.setStat1Label(request.getStat1Label());
        if (request.getStat2Number() != null) current.setStat2Number(request.getStat2Number());
        if (request.getStat2Label() != null) current.setStat2Label(request.getStat2Label());
        if (request.getStat3Number() != null) current.setStat3Number(request.getStat3Number());
        if (request.getStat3Label() != null) current.setStat3Label(request.getStat3Label());
        return repository.save(current);
    }
}
