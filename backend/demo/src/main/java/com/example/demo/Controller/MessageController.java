package com.example.demo.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.Repository.ChatAll;
import com.example.demo.Repository.UserAll;

@RestController
public class MessageController {
    @Autowired
    private UserAll userRepository;
    @Autowired
    private ChatAll chatRepository;
    
}
