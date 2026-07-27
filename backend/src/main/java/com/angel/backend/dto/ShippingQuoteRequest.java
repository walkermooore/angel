package com.angel.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record ShippingQuoteRequest(
    @NotBlank @Pattern(regexp = "\\D*\\d{5}\\D*\\d{3}\\D*") String cep,
    @NotEmpty @Size(max = 50) List<@Valid CreateOrderItemRequest> items
) {}
