package com.angel.backend.controller;

import com.angel.backend.dto.ProductRequest;
import com.angel.backend.model.Product;
import com.angel.backend.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/produtos")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public List<Product> listarProdutos() {
        return productService.listarProdutos();
    }

    @PostMapping
    public Product criarProduto(@Valid @RequestBody ProductRequest request) {
        return productService.criarProduto(request);
    }

    @PutMapping("/{id}")
    public Product atualizarProduto(@PathVariable UUID id, @RequestBody ProductRequest request){
        return productService.atualizarProduto(id, request);
    }

}
