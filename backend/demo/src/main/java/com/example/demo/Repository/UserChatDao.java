package com.example.demo.Repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public class UserChatDao {

    @PersistenceContext
    private EntityManager em;

    @Transactional
    public void addUserToChat(Integer userId, Integer chatId) {
        em.createNativeQuery("INSERT INTO user_chats (user_id, chat_id) VALUES (:userId, :chatId)")
                .setParameter("userId", userId)
                .setParameter("chatId", chatId)
                .executeUpdate();
    }

    @Transactional
    public void removeUserFromChat(Integer userId, Integer chatId) {
        em.createNativeQuery("DELETE FROM user_chats WHERE user_id = :userId AND chat_id = :chatId")
                .setParameter("userId", userId)
                .setParameter("chatId", chatId)
                .executeUpdate();
    }
}
