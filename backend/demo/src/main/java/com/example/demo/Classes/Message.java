package com.example.demo.Classes;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "chat_message")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class Message {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Integer id;
    
    @Lob
    @Column(nullable = false)
    private String content;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_id")
    @JsonBackReference
    private Chat chat;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id")
    private User sender;
    
    @Column(updatable = false)
    private LocalDateTime sentAt;
    
    private LocalDateTime readAt;
    
    private Boolean isRead = false;
    
    private Boolean isEdited = false;
    
    private LocalDateTime editedAt;
    
    @Enumerated(EnumType.STRING)
    private MessageType messageType = MessageType.TEXT;
    
    private String attachmentUrl;
    
    private String attachmentName;
    
    @PrePersist
    protected void onCreate() {
        sentAt = LocalDateTime.now();
    }
    
    public enum MessageType {
        TEXT("Text"),
        IMAGE("Image"),
        FILE("File"),
        SYSTEM("System Message");
        
        private final String displayName;
        
        MessageType(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
    
    // Legacy support
    public String getMessage() {
        return content;
    }
    
    public void setMessage(String message) {
        this.content = message;
    }
    
    public User getUser() {
        return sender;
    }
    
    public void setUser(User user) {
        this.sender = user;
    }
    
    // Constructors for backward compatibility
    public Message(String message, Chat chat, User user) {
        this.content = message;
        this.chat = chat;
        this.sender = user;
    }
    
    public Message(String content, Chat chat, User sender, MessageType messageType) {
        this.content = content;
        this.chat = chat;
        this.sender = sender;
        this.messageType = messageType;
    }
}
