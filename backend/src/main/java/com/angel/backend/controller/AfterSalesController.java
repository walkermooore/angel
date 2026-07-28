package com.angel.backend.controller;

import com.angel.backend.dto.CreateAfterSalesRequest;
import com.angel.backend.dto.UpdateAfterSalesRequest;
import com.angel.backend.model.AfterSalesRequest;
import com.angel.backend.repository.AfterSalesRequestRepository;
import com.angel.backend.service.AfterSalesService;
import com.angel.backend.service.ImageStorageService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/pos-venda")
public class AfterSalesController {
    private final AfterSalesRequestRepository repository;
    private final AfterSalesService service;
    private final ImageStorageService imageStorage;

    public AfterSalesController(AfterSalesRequestRepository repository, AfterSalesService service,
                                ImageStorageService imageStorage) {
        this.repository = repository;
        this.service = service;
        this.imageStorage = imageStorage;
    }

    @PostMapping
    public ResponseEntity<AfterSalesRequest> create(@Valid @RequestBody CreateAfterSalesRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @GetMapping("/acompanhar")
    public AfterSalesRequest track(@RequestParam String protocol, @RequestParam String token) {
        return service.track(protocol, token);
    }

    @PostMapping(path = "/anexos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> uploadAttachment(@RequestPart("file") MultipartFile file) {
        ImageStorageService.StoredImage stored = imageStorage.store(file);
        return Map.of("url", stored.url(), "contentType", stored.contentType(), "size", stored.size());
    }

    @GetMapping
    public List<AfterSalesRequest> list() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

    @PatchMapping("/{id}")
    public AfterSalesRequest update(@PathVariable UUID id, @Valid @RequestBody UpdateAfterSalesRequest request) {
        return service.update(id, request);
    }
}
