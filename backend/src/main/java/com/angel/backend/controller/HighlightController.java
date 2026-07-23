package com.angel.backend.controller;

import com.angel.backend.model.Product;
import com.angel.backend.repository.ProductRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/destaques")
public class HighlightController {

    private final ProductRepository productRepository;

    public HighlightController(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @GetMapping
    public List<Product> listarDestaques() {
        List<Product> highlights = productRepository.findByHighlightedTrue();
        if (highlights.size() < 4) {
            List<Product> all = productRepository.findAll();
            return all.subList(0, Math.min(4, all.size()));
        }
        return highlights.subList(0, 4);
    }

    @PostMapping
    public ResponseEntity<Void> atualizarDestaques(@RequestBody List<UUID> productIds) {
        if (productIds == null || productIds.size() != 4) {
            return ResponseEntity.badRequest().build();
        }

        // Reset highlights
        List<Product> all = productRepository.findAll();
        for (Product p : all) {
            p.setHighlighted(productIds.contains(p.getId()));
            productRepository.save(p);
        }

        return ResponseEntity.ok().build();
    }
}
