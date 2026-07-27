package com.angel.backend.controller;

import com.angel.backend.model.Product;
import com.angel.backend.repository.ProductRepository;
import com.angel.backend.repository.InventoryMovementRepository;
import com.angel.backend.model.InventoryMovement;
import com.angel.backend.service.InventoryService;
import com.angel.backend.exception.CheckoutException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Base64;
import java.util.UUID;

@RestController
@RequestMapping("/api/produtos")
public class ProductController {

    private final ProductRepository productRepository;
    private final InventoryMovementRepository movementRepository;
    private final InventoryService inventoryService;

    public ProductController(ProductRepository productRepository, InventoryMovementRepository movementRepository,
                             InventoryService inventoryService) {
        this.productRepository = productRepository;
        this.movementRepository = movementRepository;
        this.inventoryService = inventoryService;
    }

    @GetMapping
    public List<Product> listarProdutos() {
        return productRepository.findAll();
    }

    @GetMapping("/{id}")
    public Product buscarProduto(@PathVariable UUID id) {
        return productRepository.findById(id)
            .orElseThrow(() -> new CheckoutException(HttpStatus.NOT_FOUND, "Produto não encontrado."));
    }

    @PostMapping
    public Product criarProduto(@RequestBody Product produto) {
        if (produto.getCategory() == null || produto.getCategory().isBlank()) {
            produto.setCategory("prata");
        }
        if (produto.getDescription() == null) {
            produto.setDescription("");
        }
        if (produto.getStockQuantity() == null || produto.getStockQuantity() < 0) {
            produto.setStockQuantity(0);
        }
        produto.setReservedQuantity(0);
        produto.setSoldQuantity(0);
        if (produto.getMinimumStock() == null || produto.getMinimumStock() < 0) produto.setMinimumStock(3);
        validateImage(produto.getImageUrl());
        // Ensure id is null so JPA generates a fresh UUID
        produto.setId(null);
        return productRepository.save(produto);
    }

    @PutMapping("/{id}")
    public Product atualizarProduto(@PathVariable UUID id, @RequestBody Product request) {
            Product produto = productRepository.findById(id)
                .orElseThrow(() -> new CheckoutException(HttpStatus.NOT_FOUND, "Produto não encontrado."));
            int previousStock = produto.getStockQuantity() == null ? 0 : produto.getStockQuantity();
            if (request.getName() != null) produto.setName(request.getName());
            if (request.getDescription() != null) produto.setDescription(request.getDescription());
            if (request.getPrice() != null) produto.setPrice(request.getPrice());
            if (request.getDiscountPercent() != null) produto.setDiscountPercent(request.getDiscountPercent());
            if (request.getDiscountPrice() != null) produto.setDiscountPrice(request.getDiscountPrice());
            if (request.getCategory() != null) produto.setCategory(request.getCategory());
            if (request.getImageUrl() != null) {
                validateImage(request.getImageUrl());
                produto.setImageUrl(request.getImageUrl());
            }
            if (request.getStockQuantity() != null && request.getStockQuantity() >= 0) {
                int reserved = produto.getReservedQuantity() == null ? 0 : produto.getReservedQuantity();
                if (request.getStockQuantity() < reserved) {
                    throw new CheckoutException(HttpStatus.CONFLICT,
                        "O estoque físico não pode ser menor que a quantidade reservada (" + reserved + ").");
                }
                produto.setStockQuantity(request.getStockQuantity());
            }
            if (request.getMinimumStock() != null && request.getMinimumStock() >= 0) {
                produto.setMinimumStock(request.getMinimumStock());
            }
            Product saved = productRepository.save(produto);
            int difference = saved.getStockQuantity() - previousStock;
            if (difference != 0) {
                inventoryService.movement(saved, null, "ADJUSTMENT", difference,
                    "Ajuste manual realizado no painel", "Admin");
            }
            return saved;
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletarProduto(@PathVariable UUID id) {
        productRepository.deleteById(id);
    }

    @GetMapping("/{id}/movimentacoes")
    public List<InventoryMovement> listarMovimentacoes(@PathVariable UUID id) {
        return movementRepository.findByProductIdOrderByCreatedAtDesc(id);
    }

    private void validateImage(String image) {
        if (image == null || image.isBlank()) return;
        if (image.startsWith("https://")) {
            if (image.length() > 2_048) {
                throw new CheckoutException(HttpStatus.BAD_REQUEST, "A URL da imagem é muito longa.");
            }
            return;
        }
        if (!image.startsWith("data:image/jpeg;base64,")
            && !image.startsWith("data:image/png;base64,")
            && !image.startsWith("data:image/webp;base64,")) {
            throw new CheckoutException(HttpStatus.BAD_REQUEST,
                "Use uma URL HTTPS ou imagem JPEG, PNG ou WebP.");
        }
        int separator = image.indexOf(',');
        try {
            byte[] decoded = Base64.getDecoder().decode(image.substring(separator + 1));
            if (decoded.length > 2 * 1024 * 1024) {
                throw new CheckoutException(HttpStatus.PAYLOAD_TOO_LARGE,
                    "A imagem deve ter no máximo 2 MB.");
            }
            if (!hasAllowedSignature(decoded)) {
                throw new CheckoutException(HttpStatus.BAD_REQUEST,
                    "O conteúdo do arquivo não corresponde a uma imagem permitida.");
            }
        } catch (IllegalArgumentException exception) {
            throw new CheckoutException(HttpStatus.BAD_REQUEST, "A imagem Base64 é inválida.");
        }
    }

    private boolean hasAllowedSignature(byte[] data) {
        boolean jpeg = data.length >= 3
            && (data[0] & 0xff) == 0xff && (data[1] & 0xff) == 0xd8 && (data[2] & 0xff) == 0xff;
        boolean png = data.length >= 8
            && (data[0] & 0xff) == 0x89 && data[1] == 0x50 && data[2] == 0x4e && data[3] == 0x47;
        boolean webp = data.length >= 12
            && data[0] == 'R' && data[1] == 'I' && data[2] == 'F' && data[3] == 'F'
            && data[8] == 'W' && data[9] == 'E' && data[10] == 'B' && data[11] == 'P';
        return jpeg || png || webp;
    }
}
