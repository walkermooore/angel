package com.angel.backend.service;

import com.angel.backend.dto.ProductRequest;
import com.angel.backend.mapper.ProductMapper;
import com.angel.backend.model.Product;
import com.angel.backend.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductMapper productMapper;

    public ProductService(ProductRepository productRepository, ProductMapper productMapper){
        this.productRepository = productRepository;
        this.productMapper = productMapper;
    }

    public List<Product> listarProdutos(){
        return productRepository.findAll();
    }


    public Product criarProduto(ProductRequest request){
        Product produto = productMapper.toEntity(request);

        return productRepository.save(produto);
}
    public Product atualizarProduto(UUID id, ProductRequest request){
        Product produto = productRepository.findById(id)
                .orElseThrow();

        productMapper.updateProductFromRequest(request, produto);

        return productRepository.save(produto);
    }

    public void deletarProduto(UUID id) {
        productRepository.deleteById(id);
    }
}
