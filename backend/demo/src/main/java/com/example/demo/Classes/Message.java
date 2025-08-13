package com.example.demo.Classes;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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
    private String message;
    @ManyToOne
    @JsonBackReference
    private Chat chat;
    @ManyToOne
    @JsonBackReference
    private User user;
    public Message(String message,Chat chat,User user){
        this.message=message;
        this.chat=chat;
        this.user=user;
    }
}
