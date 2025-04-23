package com.example.demo.Repository;

import com.example.demo.Classes.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MessageAll extends JpaRepository<Message,Integer> {
}
