package com.angel.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PublicOrderTrackingRequest(
    @NotBlank @Size(max = 50) String number,
    @Size(max = 255) String contact,
    @Size(max = 100) String trackingToken
) {}
