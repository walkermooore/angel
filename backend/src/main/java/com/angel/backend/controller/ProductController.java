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
        return productRepository.save(produto);
    }

    @PutMapping("/{id}")
    public Product atualizarProduto(@PathVariable UUID id, @RequestBody Product request) {
        Product produto = productRepository.findById(id).orElseThrow();
        if (request.getName() != null) produto.setName(request.getName());
        if (request.getDescription() != null) produto.setDescription(request.getDescription());
        if (request.getPrice() != null) produto.setPrice(request.getPrice());
        if (request.getCategory() != null) produto.setCategory(request.getCategory());
        if (request.getImageUrl() != null) produto.setImageUrl(request.getImageUrl());
        return productRepository.save(produto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletarProduto(@PathVariable UUID id) {
        productRepository.deleteById(id);
    }
}
