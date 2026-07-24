package com.angel.backend.enums;

public enum Status {
    PENDENTE("Pendente"),
    PAGO("Pago"),
    ENVIADO("Enviado"),
    CONCLUIDO("Concluído"),
    CANCELADO("Cancelado");

    private final String description;

    Status(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
