package com.example.demo.Classes;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "chat_room")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class Chat {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Integer id;
    
    @Column(nullable = false)
    private String chatName;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChatType chatType = ChatType.DIRECT;
    
    @OneToMany(mappedBy = "chat", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<Message> message;
    
    @ManyToMany(mappedBy = "chats")
    private Set<User> users;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;
    
    @Column(updatable = false)
    private LocalDateTime createdAt;
    
    private LocalDateTime lastMessageAt;
    
    private String lastMessageContent;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "last_message_sender")
    private User lastMessageSender;
    
    private Boolean isActive = true;
    
    // Related case or case request for context
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id")
    private Case relatedCase;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_request_id")
    private CaseRequest relatedCaseRequest;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        lastMessageAt = LocalDateTime.now();
    }
    
    public enum ChatType {
        DIRECT("Direct Message"),
        GROUP("Group Chat"),
        CASE_RELATED("Case Discussion"),
        SUPPORT("Support Chat");
        
        private final String displayName;
        
        ChatType(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
    
    // Helper methods
    public String getDisplayName() {
        if (chatName != null && !chatName.isEmpty()) {
            return chatName;
        }
        
        if (users != null && users.size() == 2) {
            return "Direct Chat";
        }
        
        return "Group Chat";
    }
    
    public User getOtherParticipant(User currentUser) {
        if (users == null || users.size() != 2) {
            return null;
        }
        
        return users.stream()
                .filter(user -> !user.getId().equals(currentUser.getId()))
                .findFirst()
                .orElse(null);
    }
    
    public int getUnreadCount(User user) {
        if (message == null) {
            return 0;
        }
        
        return (int) message.stream()
                .filter(msg -> !msg.getSender().getId().equals(user.getId()))
                .filter(msg -> !msg.getIsRead())
                .count();
    }
}
