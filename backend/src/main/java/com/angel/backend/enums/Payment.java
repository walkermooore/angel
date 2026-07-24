package com.angel.backend.enums;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum Payment {
    PIX("PIX"),
    CARTAO("Cartão de Crédito"),
    BOLETO("Boleto Bancário");

    private final String description;

    Payment(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }

    @JsonCreator
    public static Payment fromValue(String value) {
        if (value == null || value.isBlank()) return PIX;
        String val = value.trim().toLowerCase();
        if (val.contains("pix")) return PIX;
        if (val.contains("cart") || val.contains("credit")) return CARTAO;
        if (val.contains("bol")) return BOLETO;
        try {
            return Payment.valueOf(value.toUpperCase());
        } catch (Exception e) {
            return PIX;
        }
    }
}
