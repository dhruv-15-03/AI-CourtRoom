package com.example.demo.Implementation;

import com.example.demo.Classes.Chat;
import com.example.demo.Classes.Message;
import com.example.demo.Classes.User;
import com.example.demo.Method.MessageMethod;
import com.example.demo.Repository.ChatAll;
import com.example.demo.Repository.MessageAll;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class MessageImplementation implements MessageMethod {
    @Autowired
    private MessageAll messageAll;
    @Autowired
    private ChatAll chatAll;


    @Override
    public Message newMessage(User user, Message message, Integer chatId) {
        Chat chat = chatAll.getReferenceById(chatId);
        Message newMessage = new Message();
        newMessage.setMessage(message.getMessage());
        newMessage.setChat(chat);
        newMessage.setUser(user);
        newMessage = messageAll.save(newMessage);
        // Message.chat is the owning side of the association (mappedBy = "chat" on
        // Chat.message), so persisting newMessage above is sufficient. The previous
        // implementation additionally lazy-loaded chat.getMessage() (the entire
        // message history for the chat) just to append to it and re-save the Chat,
        // and it appended the unsaved `message` argument instead of the persisted
        // `newMessage` (an id-less entity would have ended up in the collection).
        chat.setLastMessageAt(newMessage.getSentAt());
        chat.setLastMessageContent(newMessage.getMessage());
        chatAll.save(chat);
        return newMessage;
    }
}
