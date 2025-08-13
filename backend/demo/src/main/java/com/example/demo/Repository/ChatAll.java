package com.example.demo.Repository;

import com.example.demo.Classes.Chat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


@Repository
public interface ChatAll extends JpaRepository<Chat,Integer> {

}
