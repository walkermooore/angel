package com.angel.backend.enums;

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
}
