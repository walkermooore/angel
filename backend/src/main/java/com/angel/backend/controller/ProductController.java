package com.angel.backend.controller;

import com.angel.backend.model.Product;
import com.angel.backend.repository.ProductRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/produtos")
public class ProductController {

    private final ProductRepository productRepository;

    public ProductController(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @GetMapping
    public List<Product> listarProdutos() {
        return productRepository.findAll();
    }

    @PostMapping
    public Product criarProduto(@RequestBody Product produto) {
        if (produto.getCategory() == null || produto.getCategory().isBlank()) {
            produto.setCategory("prata");
        }
        if (produto.getDescription() == null) {
            produto.setDescription("");
        }
        // Ensure id is null so JPA generates a fresh UUID
        produto.setId(null);
        return productRepository.save(produto);
    }

    @PutMapping("/{id}")
    public Product atualizarProduto(@PathVariable String id, @RequestBody Product request) {
        try {
            UUID uuid = UUID.fromString(id);
            Product produto = productRepository.findById(uuid).orElseGet(() -> {
                request.setId(uuid);
                return request;
            });
            if (request.getName() != null) produto.setName(request.getName());
            if (request.getDescription() != null) produto.setDescription(request.getDescription());
            if (request.getPrice() != null) produto.setPrice(request.getPrice());
            if (request.getCategory() != null) produto.setCategory(request.getCategory());
            if (request.getImageUrl() != null) produto.setImageUrl(request.getImageUrl());
            return productRepository.save(produto);
        } catch (Exception e) {
            request.setId(null);
            return productRepository.save(request);
        }
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletarProduto(@PathVariable String id) {
        try {
            UUID uuid = UUID.fromString(id);
            productRepository.deleteById(uuid);
        } catch (Exception e) {
            // Ignore if non-UUID string
        }
    }
}
