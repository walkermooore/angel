package com.angel.backend.model;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private BigDecimal price;

    private Integer discountPercent;

    private BigDecimal discountPrice;

    @Column(nullable = false)
    private String category;

    @Column(name = "image_url", columnDefinition = "TEXT")
    @JsonProperty("image")
    @JsonAlias({"imageUrl", "image"})
    private String imageUrl;

    private Boolean highlighted = false;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    private LocalDateTime deletedAt;

    public Product(String name, String description, BigDecimal price, Integer discountPercent, BigDecimal discountPrice, String category, String imageUrl) {
        this.name = name;
        this.description = description;
        this.price = price;
        this.discountPercent = discountPercent;
        this.discountPrice = discountPrice;
        this.category = category;
        this.imageUrl = imageUrl;
    }
}