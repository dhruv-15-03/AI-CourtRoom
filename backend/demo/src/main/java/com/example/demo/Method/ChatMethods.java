package com.example.demo.Method;

import com.example.demo.Classes.Chat;
import com.example.demo.Classes.User;


public interface ChatMethods {
    public Chat newChat(User user1, User user2, Chat chat);
    public Chat findByUser(User user1, User user2);
    public String deleteById(User user,int chatId);
}
