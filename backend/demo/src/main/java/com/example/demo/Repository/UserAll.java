package com.example.demo.Repository;

import com.example.demo.Classes.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserAll extends JpaRepository<User,Integer> {
    @Query("SELECT u FROM User u where u.email LIKE (:query)")
    public User searchByEmail(@Param("query") String query);

    @Query("SELECT u FROM User u where u.isLawyer=true ")
    public List<User> getLawyers();

    @Query("SELECT u FROM User u where u.isJudge=true ")
    public List<User> getJudges();
}
