package com.example.demo.Controller;

import com.example.demo.Classes.Chat;
import com.example.demo.Classes.Message;
import com.example.demo.Classes.User;
import com.example.demo.Repository.ChatRepository;
import com.example.demo.Repository.MessageRepository;
import com.example.demo.Repository.UserAll;
import com.example.demo.Config.JwtProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Controller
@CrossOrigin(origins = {"http://localhost:3000", "https://ai-court-room.vercel.app"})
public class ChatController {
    
    @Autowired
    private ChatRepository chatRepository;
    
    @Autowired
    private MessageRepository messageRepository;
    
    @Autowired
    private UserAll userRepository;
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // REST endpoints for chat management
    @GetMapping("/api/chat/list")
    @ResponseBody
    public ResponseEntity<?> getUserChats(@RequestHeader("Authorization") String jwt) {
        try {
            String email = JwtProvider.getEmailFromJwt(jwt);
            User user = userRepository.searchByEmail(email);
            
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }
            
            List<Chat> chats = chatRepository.findChatsByUser(user);
            
            List<Map<String, Object>> chatDtos = chats.stream().map(chat -> {
                Map<String, Object> dto = new HashMap<>();
                dto.put("id", chat.getId());
                dto.put("chatName", chat.getChatName());
                dto.put("chatType", chat.getChatType().name());
                dto.put("lastMessageAt", chat.getLastMessageAt() != null ? chat.getLastMessageAt().toString() : "");
                dto.put("lastMessageContent", chat.getLastMessageContent());
                dto.put("unreadCount", chat.getUnreadCount(user));
                
                // Get other participant for direct chats
                if (chat.getChatType() == Chat.ChatType.DIRECT) {
                    User otherUser = chat.getOtherParticipant(user);
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
                    dto.put("displayName", chat.getDisplayName());
                }
                
                // Add participants for group chats
                if (chat.getUsers() != null) {
                    List<Map<String, Object>> participants = chat.getUsers().stream()
                            .filter(u -> !u.getId().equals(user.getId()))
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
            }).collect(Collectors.toList());
            
            return ResponseEntity.ok(Map.of("chats", chatDtos));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/api/chat/{chatId}/messages")
    @ResponseBody
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
            
            Chat chat = chatRepository.findById(chatId).orElse(null);
            if (chat == null || !chat.getUsers().contains(user)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Chat not found or access denied"));
            }
            
            List<Message> messages = messageRepository.findMessagesByChat(chat);
            
            // Mark messages as read
            messageRepository.markMessagesAsRead(chat, user, LocalDateTime.now());
            
            List<Map<String, Object>> messageDtos = messages.stream().map(message -> {
                Map<String, Object> dto = new HashMap<>();
                dto.put("id", message.getId());
                dto.put("content", message.getContent());
                dto.put("sentAt", message.getSentAt() != null ? message.getSentAt().toString() : "");
                dto.put("isRead", message.getIsRead());
                dto.put("messageType", message.getMessageType().name());
                
                // Sender info
                Map<String, Object> senderDto = new HashMap<>();
                senderDto.put("id", message.getSender().getId());
                senderDto.put("firstName", message.getSender().getFirstName());
                senderDto.put("lastName", message.getSender().getLastName());
                senderDto.put("image", message.getSender().getImage());
                senderDto.put("isCurrentUser", message.getSender().getId().equals(user.getId()));
                dto.put("sender", senderDto);
                
                return dto;
            }).collect(Collectors.toList());
            
            return ResponseEntity.ok(Map.of("messages", messageDtos));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
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
            
            // Get participants
            Set<User> participants = new HashSet<>();
            participants.add(currentUser);
            
            for (Integer participantId : participantIds) {
                User participant = userRepository.findById(participantId).orElse(null);
                if (participant != null) {
                    participants.add(participant);
                }
            }
            
            // For direct chats, check if chat already exists
            if (participants.size() == 2 && Chat.ChatType.DIRECT.name().equals(chatTypeStr)) {
                User otherUser = participants.stream()
                        .filter(u -> !u.getId().equals(currentUser.getId()))
                        .findFirst().orElse(null);
                
                if (otherUser != null) {
                    Optional<Chat> existingChat = chatRepository.findDirectChatBetweenUsers(currentUser, otherUser);
                    if (existingChat.isPresent()) {
                        return ResponseEntity.ok(Map.of("chatId", existingChat.get().getId(), "message", "Chat already exists"));
                    }
                }
            }
            
            // Create new chat
            Chat chat = new Chat();
            chat.setChatName(chatName != null ? chatName : generateChatName(participants, currentUser));
            chat.setChatType(Chat.ChatType.valueOf(chatTypeStr));
            chat.setUsers(participants);
            chat.setCreatedBy(currentUser);
            chat.setIsActive(true);
            
            Chat savedChat = chatRepository.save(chat);
            
            return ResponseEntity.ok(Map.of("chatId", savedChat.getId(), "message", "Chat created successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/api/chat/{chatId}/send")
    @ResponseBody
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
            
            Chat chat = chatRepository.findById(chatId).orElse(null);
            if (chat == null || !chat.getUsers().contains(user)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Chat not found or access denied"));
            }
            
            String content = (String) messageData.get("content");
            if (content == null || content.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Message content is required"));
            }
            
            Message message = new Message();
            message.setContent(content.trim());
            message.setChat(chat);
            message.setSender(user);
            message.setMessageType(Message.MessageType.TEXT);
            
            Message savedMessage = messageRepository.save(message);
            
            // Update chat's last message info
            chat.setLastMessageAt(LocalDateTime.now());
            chat.setLastMessageContent(content.trim());
            chat.setLastMessageSender(user);
            chatRepository.save(chat);
            
            // Send real-time message via WebSocket (if template is available)
            try {
                Map<String, Object> messageDto = new HashMap<>();
                messageDto.put("id", savedMessage.getId());
                messageDto.put("content", savedMessage.getContent());
                messageDto.put("sentAt", savedMessage.getSentAt().toString());
                messageDto.put("chatId", chatId);
                
                Map<String, Object> senderDto = new HashMap<>();
                senderDto.put("id", user.getId());
                senderDto.put("firstName", user.getFirstName());
                senderDto.put("lastName", user.getLastName());
                senderDto.put("image", user.getImage());
                messageDto.put("sender", senderDto);
                
                // Send to all chat participants
                for (User participant : chat.getUsers()) {
                    messagingTemplate.convertAndSendToUser(
                        participant.getId().toString(),
                        "/queue/messages",
                        messageDto
                    );
                }
            } catch (Exception e) {
                // WebSocket not configured, continue without real-time
                System.out.println("WebSocket not available: " + e.getMessage());
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
            
            List<User> users = userRepository.findAll().stream()
                    .filter(user -> !user.getId().equals(currentUser.getId()))
                    .filter(user -> {
                        String fullName = (user.getFirstName() + " " + user.getLastName()).toLowerCase();
                        return fullName.contains(query.toLowerCase()) || 
                               user.getEmail().toLowerCase().contains(query.toLowerCase());
                    })
                    .limit(limit)
                    .collect(Collectors.toList());
            
            List<Map<String, Object>> userDtos = users.stream().map(user -> {
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
            }).collect(Collectors.toList());
            
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
        headerAccessor.getSessionAttributes().put("user", messageData.get("sender"));
        return messageData;
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
