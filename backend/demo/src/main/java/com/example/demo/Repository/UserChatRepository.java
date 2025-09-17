package com.example.demo.Repository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

@Repository
public class UserChatRepository {

    @Autowired
    private UserChatDao userChatDao;

    public void addUserToChat(Integer userId, Integer chatId) {
        userChatDao.addUserToChat(userId, chatId);
    }

    public void removeUserFromChat(Integer userId, Integer chatId) {
        userChatDao.removeUserFromChat(userId, chatId);
    }
}
