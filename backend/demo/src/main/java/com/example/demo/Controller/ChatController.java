package com.example.demo.Controller;

import com.example.demo.Classes.Chat;
import com.example.demo.Classes.Message;
import com.example.demo.Classes.User;
import com.example.demo.Repository.ChatRepository;
import com.example.demo.Repository.MessageRepository;
import com.example.demo.Repository.UserAll;
import com.example.demo.Repository.UserChatDao;
import com.example.demo.Config.JwtProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Controller
@CrossOrigin(origins = {"http://localhost:3000", "https://ai-court-room.vercel.app"})
public class ChatController {
    
    @Autowired
    private UserAll userRepository;
    
    @Autowired
    private ChatRepository chatRepository;
    
    @Autowired
    private MessageRepository messageRepository;
    
    @Autowired
    private UserChatDao userChatDao;
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // REST endpoints for chat management
    @GetMapping("/api/chat/list")
    @ResponseBody
    @Transactional(readOnly = true)
    public ResponseEntity<?> getUserChats(@RequestHeader("Authorization") String jwt) {
        try {
            String email = JwtProvider.getEmailFromJwt(jwt);
            User user = userRepository.searchByEmail(email);
            
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }
            
            // Use JOIN FETCH to avoid lazy initialization issues
            List<Chat> chats = chatRepository.findChatsWithUsersByUser(user);
            
            List<Map<String, Object>> chatDtos = chats.stream()
                    .map(chat -> formatChatDto(chat, user))
                    .peek(dto -> {
                        // Ensure a safe display name is present for UI
                        Object name = dto.get("displayName");
                        if (name == null || String.valueOf(name).isBlank()) {
                            // Try to derive from other participant(s)
                            @SuppressWarnings("unchecked")
                            List<Map<String,Object>> participants = (List<Map<String,Object>>) dto.get("participants");
                            if (participants != null && !participants.isEmpty()) {
                                String label = participants.stream()
                                        .map(p -> ((p.get("firstName") != null ? p.get("firstName") : "") + " " + (p.get("lastName") != null ? p.get("lastName") : "")).trim())
                                        .filter(s -> !s.isBlank())
                                        .findFirst().orElse("Chat");
                                dto.put("displayName", label);
                            } else if (dto.get("chatName") != null) {
                                dto.put("displayName", dto.get("chatName"));
                            } else {
                                dto.put("displayName", "Chat");
                            }
                        }
                    })
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(Map.of("chats", chatDtos));
        } catch (Exception e) {
            // Log error for debugging purposes only
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/api/chat/{chatId}/messages")
    @ResponseBody
    @Transactional(readOnly = true)
    public ResponseEntity<?> getChatMessages(
            @RequestHeader("Authorization") String jwt,
            @PathVariable Integer chatId,
            @RequestParam(defaultValue = "50") int limit) {
        try {
            String email = JwtProvider.getEmailFromJwt(jwt);
            User user = userRepository.searchByEmail(email);
            
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }
            
            Optional<Chat> chatOptional = chatRepository.findById(chatId);
            if (!chatOptional.isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Chat not found"));
            }
            
            Chat chat = chatOptional.get();
            if (!chat.getUsers().contains(user)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Access denied"));
            }
            
            List<Message> messages = messageRepository.findByChatOrderBySentAtDesc(chat);
            if (limit > 0 && messages.size() > limit) {
                messages = messages.subList(0, limit);
            }
            
            List<Map<String, Object>> messageDtos = messages.stream()
                    .map(message -> formatMessageDto(message, user))
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(Map.of("messages", messageDtos));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch messages: " + e.getMessage()));
        }
    }

    @PostMapping("/api/chat/create")
    @ResponseBody
    public ResponseEntity<?> createChat(
            @RequestHeader("Authorization") String jwt,
            @RequestBody Map<String, Object> chatData) {
        try {
            String email = JwtProvider.getEmailFromJwt(jwt);
            User currentUser = userRepository.searchByEmail(email);
            
            if (currentUser == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }
            
            @SuppressWarnings("unchecked")
            List<Integer> participantIds = (List<Integer>) chatData.get("participantIds");
            String chatName = (String) chatData.get("chatName");
            String chatTypeStr = (String) chatData.getOrDefault("chatType", "DIRECT");
            
            if (participantIds == null || participantIds.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "At least one participant is required"));
            }
            
            // Create chat directly in controller
            Set<User> participants = new HashSet<>();
            for (Integer participantId : participantIds) {
                Optional<User> userOpt = userRepository.findById(participantId);
                if (userOpt.isPresent()) {
                    participants.add(userOpt.get());
                }
            }
            participants.add(currentUser); // Add current user to participants
            
            Chat.ChatType chatType = Chat.ChatType.valueOf(chatTypeStr.toUpperCase());
            
            Chat chat = new Chat();
            chat.setChatType(chatType);
            chat.setCreatedAt(LocalDateTime.now());
            chat.setLastMessageAt(LocalDateTime.now());
            chat.setUsers(participants);
            
            if (chatName != null && !chatName.trim().isEmpty()) {
                chat.setChatName(chatName);
            } else {
                String generatedName = generateChatName(participants, currentUser);
                chat.setChatName(generatedName);
            }
            
            Chat savedChat = chatRepository.save(chat);
            
            // Add users to chat via join table
            for (User user : participants) {
                userChatDao.addUserToChat(user.getId(), savedChat.getId());
            }
            
            return ResponseEntity.ok(Map.of("chatId", savedChat.getId(), "message", "Chat created successfully"));
        } catch (Exception e) {
            // Log error for debugging purposes only
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/api/chat/{chatId}/send")
    @ResponseBody
    @Transactional
    public ResponseEntity<?> sendMessage(
            @RequestHeader("Authorization") String jwt,
            @PathVariable Integer chatId,
            @RequestBody Map<String, Object> messageData) {
        try {
            String email = JwtProvider.getEmailFromJwt(jwt);
            User user = userRepository.searchByEmail(email);
            
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }
            
            String content = (String) messageData.get("content");
            if (content == null || content.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Message content is required"));
            }
            
            // Send message directly
            Optional<Chat> chatOptional = chatRepository.findById(chatId);
            if (!chatOptional.isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Chat not found"));
            }
            
        Chat chat = chatOptional.get();
        boolean isMember = chat.getUsers() != null && chat.getUsers().stream()
            .anyMatch(u -> Objects.equals(u.getId(), user.getId()));
        if (!isMember) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Access denied"));
            }
            
            // Create message directly
            Message message = new Message();
            message.setContent(content.trim());
            message.setSender(user);
            message.setChat(chat);
            message.setSentAt(LocalDateTime.now());
            message.setIsRead(false);
            message.setMessageType(Message.MessageType.TEXT);
            
            Message savedMessage = messageRepository.save(message);
            
            // Update chat's last message info
            chat.setLastMessageAt(LocalDateTime.now());
            chat.setLastMessageContent(content.trim());
            chatRepository.save(chat);
            
            // Send real-time message via WebSocket
            try {
                // Send per-recipient with correct isCurrentUser flag
                for (User participant : chat.getUsers()) {
                    Map<String, Object> perRecipientDto = formatMessageDto(savedMessage, participant);
                    String principalName = participant.getEmail();
                    messagingTemplate.convertAndSendToUser(
                        principalName,
                        "/queue/messages",
                        perRecipientDto
                    );
                }
            } catch (Exception e) {
                // WebSocket not configured or broadcast failed - message already saved
                // Continue silently as this is a non-critical feature
            }
            
            return ResponseEntity.ok(Map.of("messageId", savedMessage.getId(), "message", "Message sent successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/api/chat/search-users")
    @ResponseBody
    public ResponseEntity<?> searchUsers(
            @RequestHeader("Authorization") String jwt,
            @RequestParam String query,
            @RequestParam(defaultValue = "10") int limit) {
        try {
            String email = JwtProvider.getEmailFromJwt(jwt);
            User currentUser = userRepository.searchByEmail(email);
            
            if (currentUser == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }
            
            List<User> users = userRepository.searchUsersByQuery(query, currentUser.getId());
            if (limit > 0 && users.size() > limit) {
                users = users.subList(0, limit);
            }
            
            List<Map<String, Object>> userDtos = users.stream()
                    .map(user -> formatUserDto(user))
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(Map.of("users", userDtos));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // WebSocket message handling
    @MessageMapping("/chat.sendMessage")
    @SendTo("/topic/public")
    public Map<String, Object> sendMessage(@Payload Map<String, Object> messageData) {
        return messageData;
    }

    @MessageMapping("/chat.addUser")
    @SendTo("/topic/public")
    public Map<String, Object> addUser(@Payload Map<String, Object> messageData,
                                       SimpMessageHeaderAccessor headerAccessor) {
        Map<String, Object> sessionAttributes = headerAccessor.getSessionAttributes();
        if (sessionAttributes != null) {
            sessionAttributes.put("user", messageData.get("sender"));
        }
        return messageData;
    }
    
    // Helper methods moved from ChatService
    private Map<String, Object> formatChatDto(Chat chat, User currentUser) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", chat.getId());
        dto.put("chatName", chat.getChatName());
        dto.put("chatType", chat.getChatType().name());
        dto.put("lastMessageAt", chat.getLastMessageAt() != null ? chat.getLastMessageAt().toString() : "");
        dto.put("lastMessageContent", chat.getLastMessageContent());
        dto.put("unreadCount", chat.getUnreadCount(currentUser));
        dto.put("createdAt", chat.getCreatedAt() != null ? chat.getCreatedAt().toString() : "");
        
        // Get other participant for direct chats
        if (chat.getChatType() == Chat.ChatType.DIRECT) {
            User otherUser = chat.getOtherParticipant(currentUser);
            if (otherUser != null) {
                Map<String, Object> otherUserDto = new HashMap<>();
                otherUserDto.put("id", otherUser.getId());
                otherUserDto.put("firstName", otherUser.getFirstName());
                otherUserDto.put("lastName", otherUser.getLastName());
                otherUserDto.put("image", otherUser.getImage());
                otherUserDto.put("isLawyer", otherUser.getIsLawyer());
                otherUserDto.put("isJudge", otherUser.getIsJudge());
                dto.put("otherUser", otherUserDto);
                dto.put("displayName", otherUser.getFirstName() + " " + otherUser.getLastName());
            }
        } else {
            dto.put("displayName", chat.getChatName());
        }
        
        // Add participants for group chats
        if (chat.getUsers() != null) {
            List<Map<String, Object>> participants = chat.getUsers().stream()
                    .filter(u -> !u.getId().equals(currentUser.getId()))
                    .map(u -> {
                        Map<String, Object> participantDto = new HashMap<>();
                        participantDto.put("id", u.getId());
                        participantDto.put("firstName", u.getFirstName());
                        participantDto.put("lastName", u.getLastName());
                        participantDto.put("image", u.getImage());
                        return participantDto;
                    }).collect(Collectors.toList());
            dto.put("participants", participants);
        }
        
        return dto;
    }
    
    private Map<String, Object> formatMessageDto(Message message, User currentUser) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", message.getId());
        dto.put("content", message.getContent());
        dto.put("sentAt", message.getSentAt() != null ? message.getSentAt().toString() : "");
        dto.put("isRead", message.getIsRead());
        dto.put("messageType", message.getMessageType().name());
        dto.put("chatId", message.getChat().getId());
        
        // Sender info
        Map<String, Object> senderDto = new HashMap<>();
        senderDto.put("id", message.getSender().getId());
        senderDto.put("firstName", message.getSender().getFirstName());
        senderDto.put("lastName", message.getSender().getLastName());
        senderDto.put("image", message.getSender().getImage());
        senderDto.put("isCurrentUser", message.getSender().getId().equals(currentUser.getId()));
        dto.put("sender", senderDto);
        
        return dto;
    }
    
    private Map<String, Object> formatUserDto(User user) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", user.getId());
        dto.put("firstName", user.getFirstName());
        dto.put("lastName", user.getLastName());
        dto.put("email", user.getEmail());
        dto.put("image", user.getImage());
        dto.put("isLawyer", user.getIsLawyer());
        dto.put("isJudge", user.getIsJudge());
        dto.put("specialisation", user.getSpecialisation());
        return dto;
    }
    
    private String generateChatName(Set<User> participants, User currentUser) {
        if (participants.size() == 2) {
            User otherUser = participants.stream()
                    .filter(u -> !u.getId().equals(currentUser.getId()))
                    .findFirst().orElse(null);
            if (otherUser != null) {
                return otherUser.getFirstName() + " " + otherUser.getLastName();
            }
        }
        
        return participants.stream()
                .filter(u -> !u.getId().equals(currentUser.getId()))
                .map(u -> u.getFirstName())
                .collect(Collectors.joining(", "));
    }
}
