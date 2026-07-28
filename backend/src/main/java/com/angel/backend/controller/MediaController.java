package com.angel.backend.controller;

import com.angel.backend.service.ImageStorageService;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/media/images")
public class MediaController {
    private final ImageStorageService storage;

    public MediaController(ImageStorageService storage) {
        this.storage = storage;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> upload(@RequestPart("file") MultipartFile file) {
        ImageStorageService.StoredImage stored = storage.store(file);
        return Map.of(
            "url", stored.url(),
            "filename", stored.filename(),
            "contentType", stored.contentType(),
            "size", stored.size()
        );
    }

    @GetMapping("/{filename}")
    public ResponseEntity<FileSystemResource> image(@PathVariable String filename) {
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(storage.contentType(filename)))
            .cacheControl(CacheControl.maxAge(365, TimeUnit.DAYS).cachePublic().immutable())
            .body(new FileSystemResource(storage.resolve(filename)));
    }
}
