package com.angel.backend.controller;

import com.angel.backend.model.Product;
import com.angel.backend.repository.ProductRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/produtos")
public class ProductController {

    private final ProductRepository productRepository;

    public ProductController(ProductRepository productRepository){
        this.productRepository = productRepository;
    }

    @GetMapping
    public List<Product> listarProdutos() {
        return productRepository.findAll();
    }

}
