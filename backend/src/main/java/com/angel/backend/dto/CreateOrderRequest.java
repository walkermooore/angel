package com.angel.backend.dto;

import com.angel.backend.enums.Payment;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateOrderRequest(
    @NotBlank @Size(max = 255) String customerName,
    @NotBlank @Email @Size(max = 255) String email,
    @NotBlank @Pattern(regexp = "\\+?[0-9 ()-]{10,20}") String phone,
    @NotEmpty @Size(max = 50) List<@Valid CreateOrderItemRequest> items,
    @NotBlank @Pattern(regexp = "entrega|retirada") String shippingOption,
    @NotBlank @Pattern(regexp = "PICKUP|ME-[0-9]+") String shippingQuoteId,
    @NotNull Payment payment,
    @Valid CreateOrderAddressRequest address
) {}
