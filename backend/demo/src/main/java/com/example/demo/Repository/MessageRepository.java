package com.example.demo.Repository;

import com.example.demo.Classes.Message;
import com.example.demo.Classes.Chat;
import com.example.demo.Classes.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Integer> {
    
    @Query("SELECT m FROM Message m WHERE m.chat = :chat ORDER BY m.sentAt ASC")
    List<Message> findByChatOrderBySentAtAsc(@Param("chat") Chat chat);
    
    @Query("SELECT m FROM Message m WHERE m.chat = :chat ORDER BY m.sentAt DESC")
    List<Message> findByChatOrderBySentAtDesc(@Param("chat") Chat chat);
    List<Message> findByChat(Chat chat);
    
    @Query("SELECT m FROM Message m WHERE m.chat = :chat ORDER BY m.sentAt DESC")
    List<Message> findMessagesByChatOrderByNewest(@Param("chat") Chat chat);
    
    @Query("SELECT m FROM Message m WHERE m.chat = :chat AND m.sentAt >= :since ORDER BY m.sentAt ASC")
    List<Message> findRecentMessages(@Param("chat") Chat chat, @Param("since") LocalDateTime since);
    
    @Query("SELECT m FROM Message m WHERE m.chat = :chat AND m.sender != :user AND m.isRead = false ORDER BY m.sentAt ASC")
    List<Message> findUnreadMessagesInChat(@Param("chat") Chat chat, @Param("user") User user);
    
    @Query("SELECT m FROM Message m WHERE m.sender = :sender ORDER BY m.sentAt DESC")
    List<Message> findMessagesBySender(@Param("sender") User sender);
    
    @Query("SELECT m FROM Message m WHERE m.content LIKE %:query% ORDER BY m.sentAt DESC")
    List<Message> searchMessagesByContent(@Param("query") String query);
    
    @Query("SELECT m FROM Message m WHERE m.chat = :chat AND m.content LIKE %:query% ORDER BY m.sentAt DESC")
    List<Message> searchMessagesInChat(@Param("chat") Chat chat, @Param("query") String query);
    
    @Query("SELECT COUNT(m) FROM Message m WHERE m.chat = :chat AND m.sender != :user AND m.isRead = false")
    long countUnreadMessagesInChat(@Param("chat") Chat chat, @Param("user") User user);
    
    @Modifying
    @Transactional
    @Query("UPDATE Message m SET m.isRead = true, m.readAt = :readAt WHERE m.chat = :chat AND m.sender != :user AND m.isRead = false")
    void markMessagesAsRead(@Param("chat") Chat chat, @Param("user") User user, @Param("readAt") LocalDateTime readAt);
    
    // Use derived query instead of JPQL LIMIT (not supported in JPQL)
    Message findTopByChatOrderBySentAtDesc(Chat chat);
    
    // Find messages by type
    @Query("SELECT m FROM Message m WHERE m.messageType = :messageType ORDER BY m.sentAt DESC")
    List<Message> findMessagesByType(@Param("messageType") Message.MessageType messageType);
    
    // Delete messages older than specified date
    @Modifying
    @Transactional
    @Query("DELETE FROM Message m WHERE m.sentAt < :date")
    void deleteMessagesOlderThan(@Param("date") LocalDateTime date);
    
    // Count messages in chat
    @Query("SELECT COUNT(m) FROM Message m WHERE m.chat = :chat")
    long countMessagesInChat(@Param("chat") Chat chat);
}
