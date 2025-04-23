package com.example.demo.Repository;

import com.example.demo.Classes.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface UserAll extends JpaRepository<User,Integer> {
    @Query("SELECT u FROM User u where u.email LIKE (:query)")
    public User searchByEmail(@Param("query") String query);

    @Query("SELECT u FROM User u where u.isLawyer=true ")
    public User getLawyers();

    @Query("SELECT u FROM User u where u.isJudge=true ")
    public User getJudges();
}
