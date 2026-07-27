package com.angel.backend.exception;

import com.angel.backend.security.CorrelationIdFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(CheckoutException.class)
    ResponseEntity<Map<String, Object>> handleCheckout(CheckoutException exception, HttpServletRequest request) {
        return ResponseEntity
            .status(exception.getStatus())
            .body(errorBody("CHECKOUT_ERROR", exception.getMessage(), request));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException exception,
                                                          HttpServletRequest request) {
        Map<String, String> fields = new LinkedHashMap<>();
        exception.getBindingResult().getFieldErrors().forEach(error ->
            fields.putIfAbsent(error.getField(), validationMessage(error.getField())));
        Map<String, Object> body = errorBody("VALIDATION_ERROR",
            "Revise os campos indicados e tente novamente.", request);
        body.put("fields", fields);
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler({ConstraintViolationException.class, HttpMessageNotReadableException.class})
    ResponseEntity<Map<String, Object>> handleInvalidRequest(Exception exception, HttpServletRequest request) {
        log.info("Requisição inválida [{}]: {}", correlationId(request), exception.getMessage());
        return ResponseEntity.badRequest().body(errorBody(
            "INVALID_REQUEST", "A requisição contém dados inválidos ou campos não permitidos.", request));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<Map<String, Object>> handleUnexpected(Exception exception, HttpServletRequest request) {
        String id = correlationId(request);
        log.error("Erro interno não tratado [{}]", id, exception);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorBody(
            "INTERNAL_ERROR",
            "Não foi possível concluir a operação. Tente novamente e informe o código de atendimento se o erro persistir.",
            request));
    }

    private Map<String, Object> errorBody(String code, String message, HttpServletRequest request) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("code", code);
        body.put("message", message);
        body.put("correlationId", correlationId(request));
        return body;
    }

    private String correlationId(HttpServletRequest request) {
        Object value = request.getAttribute(CorrelationIdFilter.ATTRIBUTE);
        return value == null ? "indisponivel" : value.toString();
    }

    private String validationMessage(String field) {
        return switch (field) {
            case "customerName" -> "Informe o nome completo.";
            case "email" -> "Informe um e-mail válido.";
            case "phone" -> "Informe um telefone válido com DDD.";
            case "items" -> "Inclua ao menos um produto válido.";
            case "shippingOption", "shippingQuoteId" -> "Selecione uma modalidade de entrega válida.";
            case "address.cep" -> "Informe um CEP válido com 8 dígitos.";
            case "address.state" -> "Informe uma UF válida.";
            default -> "Valor inválido.";
        };
    }
}
