package com.angel.backend.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductRequest {

    @NotBlank
    private String name;

    @NotBlank
    private String description;

    @NotNull
    @Positive
    private BigDecimal price;

    private Integer discountPercent;

    private BigDecimal discountPrice;

    @NotBlank
    private String category;

    @NotBlank
    private String imageUrl;

    private Boolean highlighted;
}
