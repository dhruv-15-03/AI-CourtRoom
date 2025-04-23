package com.example.demo.Repository;

import com.example.demo.Classes.Chat;
import com.example.demo.Classes.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatAll extends JpaRepository<Chat,Integer> {

}
