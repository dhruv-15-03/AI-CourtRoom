package com.example.demo.Method;

import com.example.demo.Classes.Message;
import com.example.demo.Classes.User;

public interface MessageMethod {
    public Message newMessage(User user, Message message, Integer chatId);
}
