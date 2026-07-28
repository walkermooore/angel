package com.angel.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record InfinitePayCheckoutRequest(
    @NotBlank @Size(max = 255) String orderNumber,
    @NotBlank @Size(max = 100) String trackingToken
) {}
