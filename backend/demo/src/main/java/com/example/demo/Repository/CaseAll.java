package com.example.demo.Repository;

import com.example.demo.Classes.Case;
import com.example.demo.Classes.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface CaseAll extends JpaRepository<Case,Integer> {
    
    // Search queries
    @Query("SELECT c FROM Case c WHERE c.description LIKE :query")
    List<Case> searchByName(@Param("query") String query);
    
    // Status queries
    @Query("SELECT c FROM Case c WHERE c.isClose = false")
    List<Case> findActiveCases();
    
    @Query("SELECT c FROM Case c WHERE c.isClose = true")
    List<Case> findClosedCases();
    
    // User-based queries
    @Query("SELECT c FROM Case c JOIN c.user u WHERE u = :user")
    List<Case> findCasesByUser(@Param("user") User user);
    
    @Query("SELECT c FROM Case c JOIN c.lawyer l WHERE l = :lawyer")
    List<Case> findCasesByLawyer(@Param("lawyer") User lawyer);
    
    @Query("SELECT c FROM Case c WHERE c.judge = :judge")
    List<Case> findCasesByJudge(@Param("judge") User judge);
    
    // Date-based queries
    @Query("SELECT c FROM Case c WHERE c.date BETWEEN :startDate AND :endDate")
    List<Case> findCasesByDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    @Query("SELECT c FROM Case c WHERE c.next = :date")
    List<Case> findCasesByNextHearingDate(@Param("date") LocalDate date);
    
    @Query("SELECT c FROM Case c WHERE c.next IS NOT NULL AND c.next >= :today AND c.isClose = false")
    List<Case> findUpcomingHearings(@Param("today") LocalDate today);
    
    // Count queries
    @Query("SELECT COUNT(c) FROM Case c WHERE c.isClose = false")
    long countActiveCases();
    
    @Query("SELECT COUNT(c) FROM Case c WHERE c.isClose = true")
    long countClosedCases();
}
