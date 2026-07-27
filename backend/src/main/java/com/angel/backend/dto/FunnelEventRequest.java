package com.angel.backend.dto;

import jakarta.validation.constraints.NotNull;

public record FunnelEventRequest(
    @NotNull Event event,
    String context
) {
    public enum Event {
        PRODUCT_VIEWED,
        SEARCH,
        CART_ITEM_ADDED,
        CART_ITEM_REMOVED,
        CHECKOUT_STARTED,
        SHIPPING_SELECTED,
        FREIGHT_CALCULATED,
        PAYMENT_SELECTED,
        FORM_ERROR,
        CHARGE_CREATED,
        PAYMENT_APPROVED,
        CART_ABANDONED,
        ORDER_COMPLETED
    }
}
