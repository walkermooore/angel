package com.angel.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record InfinitePayWebhookRequest(
    @JsonProperty("invoice_slug") String invoiceSlug,
    Long amount,
    @JsonProperty("paid_amount") Long paidAmount,
    Integer installments,
    @JsonProperty("capture_method") String captureMethod,
    @JsonProperty("transaction_nsu") String transactionNsu,
    @JsonProperty("order_nsu") String orderNsu,
    @JsonProperty("receipt_url") String receiptUrl,
    List<Object> items
) {}
