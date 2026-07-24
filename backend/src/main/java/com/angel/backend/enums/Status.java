package com.angel.backend.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum Status {
    PENDENTE("Pendente"),
    PAGO("Pago"),
    ENVIADO("Enviado"),
    PRONTO_PARA_RETIRADA("Pronto para Retirada"),
    CONCLUIDO("Concluído"),
    CANCELADO("Cancelado");

    private final String description;

    Status(String description) {
        this.description = description;
    }

    @JsonValue
    public String getDescription() {
        return description;
    }

    @JsonCreator
    public static Status fromValue(String value) {
        if (value == null || value.isBlank()) return PENDENTE;
        String val = value.trim().toLowerCase();
        if (val.contains("pronto") || val.contains("retirada")) return PRONTO_PARA_RETIRADA;
        if (val.contains("pago") || val.contains("pay")) return PAGO;
        if (val.contains("envi")) return ENVIADO;
        if (val.contains("concl")) return CONCLUIDO;
        if (val.contains("canc")) return CANCELADO;
        try {
            return Status.valueOf(value.toUpperCase());
        } catch (Exception e) {
            return PENDENTE;
        }
    }
}
