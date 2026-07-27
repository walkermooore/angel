package com.angel.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public record PublicOrderTrackingResponse(
    String number,
    String status,
    String shippingOption,
    String trackingCode,
    String maskedEmail,
    String maskedPhone,
    LocalDateTime createdAt,
    List<Item> items
) {
    public record Item(String name, int quantity) {}
}
