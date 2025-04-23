package com.example.demo.Implementation;

import com.example.demo.Classes.Chat;
import com.example.demo.Classes.Message;
import com.example.demo.Classes.User;
import com.example.demo.Method.MessageMethod;
import com.example.demo.Repository.ChatAll;
import com.example.demo.Repository.MessageAll;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MessageImplementation implements MessageMethod {
    @Autowired
    private MessageAll messageAll;
    @Autowired
    private ChatAll chatAll;


    @Override
    public Message newMessage(User user, Message message, Integer chatId) {
        Message newMessage=new Message();
        newMessage.setMessage(message.getMessage());
        newMessage.setChat(chatAll.getReferenceById(chatId));
        newMessage.setUser(user);
        messageAll.save(newMessage);
        Chat chat=chatAll.getReferenceById(chatId);
        List<Message> temp=chat.getMessage();
        temp.add(message);
        chat.setMessage(temp);
        chatAll.save(chat);
        return newMessage;
    }
}
