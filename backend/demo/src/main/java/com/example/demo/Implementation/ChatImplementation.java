package com.example.demo.Implementation;

import com.example.demo.Classes.Chat;
import com.example.demo.Classes.User;
import com.example.demo.Method.ChatMethods;
import com.example.demo.Repository.ChatAll;
import com.example.demo.Repository.UserAll;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class ChatImplementation implements ChatMethods {
    @Autowired
    private ChatAll chatAll;
    @Autowired
    private UserAll userAll;
    @Override
    public Chat newChat(User user1, User user2, Chat chat) {
        Chat chat1=new Chat();
        chat1.setMessage(new ArrayList<>());
        Set<User> set=new HashSet<>();
        set.add(user1);
        set.add(user2);
        chat1.setUsers(set);
        chatAll.save(chat1);
        return chat1;
    }

    @Override
    public Chat findByUser(User user1, User user2) {
        Set<Chat> set=user1.getChats();
        for(Chat chat:set){
            if(chat.getUsers().contains(user2)){
                return chat;
            }
        }
        return null;
    }

    @Override
    public String deleteById(User user, int chatId) {
        Chat chat=chatAll.getReferenceById(chatId);
        Set<Chat> set=user.getChats();
        set.remove(chat);
        user.setChats(set);
        userAll.save(user);
        return null;
    }


}
