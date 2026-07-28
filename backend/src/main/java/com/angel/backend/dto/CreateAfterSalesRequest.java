package com.angel.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateAfterSalesRequest(
    @NotBlank @Size(max = 60) String orderNumber,
    @Size(max = 120) String trackingToken,
    @Size(max = 320) String contact,
    @NotBlank @Size(max = 30) String requestType,
    @NotBlank @Size(max = 120) String reason,
    @Size(max = 3000) String details,
    @Size(max = 3) List<@Size(max = 1000) String> attachmentUrls
) {}
