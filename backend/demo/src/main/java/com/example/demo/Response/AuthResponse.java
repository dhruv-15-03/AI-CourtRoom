package com.example.demo.Response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
@JsonIgnoreProperties(ignoreUnknown = true)
public class AuthResponse {
    private  String token;
    private String message;

    public AuthResponse() {
    }

    public AuthResponse(String token, String message) {
        super();
        this.token = token;
        this.message = message;
    }
}
