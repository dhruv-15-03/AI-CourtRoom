package com.example.demo.Response;

import lombok.Getter;
import lombok.Setter;
@Setter
@Getter
public class Login { private String email;

   private String password;

    public Login() {
    }

    public Login(String email, String password) {
        this.email = email;
        this.password = password;
    }



}
