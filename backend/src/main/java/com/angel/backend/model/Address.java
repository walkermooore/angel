package com.angel.backend.model;


import jakarta.persistence.Embeddable;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Embeddable
public class Address {

    private String cep;

    private String street;

    private String number;

    private String complement;

    private String neighborhood;

    private String city;

    private String state;

}
