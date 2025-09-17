package com.example.demo.Repository;

import com.example.demo.Classes.Chat;
import com.example.demo.Classes.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRepository extends JpaRepository<Chat, Integer> {
    
    // Find chats by user with JOIN FETCH to avoid lazy loading
    @Query("SELECT DISTINCT c FROM Chat c JOIN FETCH c.users u WHERE u = :user AND c.isActive = true ORDER BY COALESCE(c.lastMessageAt, c.createdAt) DESC")
    List<Chat> findChatsWithUsersByUser(@Param("user") User user);
    
    // Find chats by user
    @Query("SELECT c FROM Chat c JOIN c.users u WHERE u = :user AND c.isActive = true ORDER BY COALESCE(c.lastMessageAt, c.createdAt) DESC")
    List<Chat> findChatsByUser(@Param("user") User user);
    
    // Find direct chat between two users
    @Query("SELECT c FROM Chat c JOIN c.users u1 JOIN c.users u2 WHERE u1 = :user1 AND u2 = :user2 AND c.chatType = 'DIRECT' AND c.isActive = true")
    Optional<Chat> findDirectChatBetweenUsers(@Param("user1") User user1, @Param("user2") User user2);
    
    // Find chats by type
    @Query("SELECT c FROM Chat c WHERE c.chatType = :chatType AND c.isActive = true ORDER BY c.lastMessageAt DESC")
    List<Chat> findChatsByType(@Param("chatType") Chat.ChatType chatType);
    
    // Find chats related to a case
    @Query("SELECT c FROM Chat c WHERE c.relatedCase.id = :caseId AND c.isActive = true")
    List<Chat> findChatsByCaseId(@Param("caseId") Integer caseId);
    
    // Find chats related to a case request
    @Query("SELECT c FROM Chat c WHERE c.relatedCaseRequest.id = :caseRequestId AND c.isActive = true")
    List<Chat> findChatsByCaseRequestId(@Param("caseRequestId") Integer caseRequestId);
    
    // Find recent chats
    @Query("SELECT c FROM Chat c WHERE c.lastMessageAt >= :since AND c.isActive = true ORDER BY c.lastMessageAt DESC")
    List<Chat> findRecentChats(@Param("since") LocalDateTime since);
    
    // Search chats by name
    @Query("SELECT c FROM Chat c WHERE c.chatName LIKE %:query% AND c.isActive = true")
    List<Chat> searchChatsByName(@Param("query") String query);
    
    // Find chats with unread messages for a user
    @Query("SELECT DISTINCT c FROM Chat c JOIN c.users u JOIN c.message m WHERE u = :user AND m.sender != :user AND m.isRead = false AND c.isActive = true")
    List<Chat> findChatsWithUnreadMessages(@Param("user") User user);
    
    // Count unread messages for a user across all chats
    @Query("SELECT COUNT(m) FROM Chat c JOIN c.users u JOIN c.message m WHERE u = :user AND m.sender != :user AND m.isRead = false AND c.isActive = true")
    long countUnreadMessagesForUser(@Param("user") User user);
    
    // Find active chats for user (has recent activity)
    @Query("SELECT c FROM Chat c JOIN c.users u WHERE u = :user AND c.lastMessageAt >= :since AND c.isActive = true ORDER BY c.lastMessageAt DESC")
    List<Chat> findActiveChatsForUser(@Param("user") User user, @Param("since") LocalDateTime since);
}
