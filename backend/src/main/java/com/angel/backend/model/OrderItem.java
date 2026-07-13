package com.angel.backend.model;


import jakarta.persistence.Embeddable;

import java.math.BigDecimal;
import java.util.UUID;

@Embeddable
public class OrderItem {
    private UUID productId;

    private String name;

    private BigDecimal price;

    private Integer quantity;

    private String image;
}
