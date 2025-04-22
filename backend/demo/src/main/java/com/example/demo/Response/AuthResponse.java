package com.example.demo.Response;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
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
