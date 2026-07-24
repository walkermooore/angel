package com.angel.backend.model;

import jakarta.persistence.Embeddable;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@Embeddable
public class OrderItem {

    private String productId;

    private String name;

    private BigDecimal price;

    private Integer quantity;

    private String image;
}
