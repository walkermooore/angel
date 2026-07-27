package com.angel.backend.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateOrderAddressRequest(
    @Pattern(regexp = "^$|\\d{5}-?\\d{3}$") String cep,
    @Size(max = 255) String street,
    @Size(max = 50) String number,
    @Size(max = 255) String complement,
    @Size(max = 255) String neighborhood,
    @Size(max = 255) String city,
    @Pattern(regexp = "^$|(?i:AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)$")
    String state
) {}
