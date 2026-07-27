package com.angel.backend.dto;

import java.math.BigDecimal;

public record ShippingQuoteResponse(
    String id,
    String name,
    BigDecimal price,
    int deliveryTime,
    String company,
    String companyLogo
) {}
