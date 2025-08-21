package com.example.demo.Repository;

import com.example.demo.Classes.CaseTimeline;
import com.example.demo.Classes.Case;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CaseTimelineRepository extends JpaRepository<CaseTimeline, Integer> {
    
    @Query("SELECT t FROM CaseTimeline t WHERE t.courtCase = :case ORDER BY t.eventDateTime DESC")
    List<CaseTimeline> findByCourtCaseOrderByDateDesc(@Param("case") Case courtCase);
    
    @Query("SELECT t FROM CaseTimeline t WHERE t.eventType = :eventType")
    List<CaseTimeline> findByEventType(@Param("eventType") String eventType);
    
    @Query("SELECT t FROM CaseTimeline t WHERE t.performedBy = :performedBy")
    List<CaseTimeline> findByPerformedBy(@Param("performedBy") String performedBy);
    
    @Query("SELECT t FROM CaseTimeline t WHERE t.importance = :importance")
    List<CaseTimeline> findByImportance(@Param("importance") CaseTimeline.EventImportance importance);
    
    @Query("SELECT t FROM CaseTimeline t WHERE t.eventDateTime BETWEEN :start AND :end ORDER BY t.eventDateTime DESC")
    List<CaseTimeline> findByDateRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    @Query("SELECT t FROM CaseTimeline t WHERE t.courtCase = :case AND t.eventType = :eventType ORDER BY t.eventDateTime DESC")
    List<CaseTimeline> findByCourtCaseAndEventType(@Param("case") Case courtCase, @Param("eventType") String eventType);
    
    @Query("SELECT COUNT(t) FROM CaseTimeline t WHERE t.courtCase = :case")
    long countByCourtCase(@Param("case") Case courtCase);
    
    @Query("SELECT t FROM CaseTimeline t WHERE t.eventDateTime >= :since ORDER BY t.eventDateTime DESC")
    List<CaseTimeline> findRecentEvents(@Param("since") LocalDateTime since);
}
