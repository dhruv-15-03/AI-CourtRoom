package com.example.demo.Controller;

import com.example.demo.Repository.UserAll;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RestController;

@RestController("/api/user")
public class UserController {
    @Autowired
    private UserAll userAll;
}
