package com.example.demo.Repository;

import com.example.demo.Classes.Case;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CaseAll extends JpaRepository<Case,Integer> {
    @Query("SELECT u FROM Case u where u.description LIKE (:query) ")
    public List<Case> searchByName(@Param("query") String query);
}
