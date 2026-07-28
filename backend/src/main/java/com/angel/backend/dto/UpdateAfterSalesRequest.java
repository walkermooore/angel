package com.angel.backend.dto;

import jakarta.validation.constraints.Size;

public record UpdateAfterSalesRequest(
    @Size(max = 40) String status,
    @Size(max = 40) String refundStatus,
    Boolean returnToStock,
    @Size(max = 3000) String adminNote
) {}
