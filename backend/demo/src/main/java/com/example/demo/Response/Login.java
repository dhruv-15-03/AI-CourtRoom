package com.example.demo.Response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;
@Setter
@Getter
@JsonIgnoreProperties(ignoreUnknown = true)
public class Login { private String email;

   private String password;

    public Login() {
    }

    public Login(String email, String password) {
        this.email = email;
        this.password = password;
    }



}
