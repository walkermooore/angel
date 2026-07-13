package com.angel.backend.model;


import jakarta.persistence.Embeddable;

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
