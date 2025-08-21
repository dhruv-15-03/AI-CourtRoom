package com.example.demo.Repository;

import com.example.demo.Classes.CaseHearing;
import com.example.demo.Classes.Case;
import com.example.demo.Classes.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CaseHearingRepository extends JpaRepository<CaseHearing, Integer> {
    
    @Query("SELECT h FROM CaseHearing h WHERE h.courtCase = :case ORDER BY h.hearingDateTime DESC")
    List<CaseHearing> findByCourtCaseOrderByDateDesc(@Param("case") Case courtCase);
    
    @Query("SELECT h FROM CaseHearing h WHERE DATE(h.hearingDateTime) = :date ORDER BY h.hearingDateTime ASC")
    List<CaseHearing> findByHearingDate(@Param("date") LocalDate date);
    
    @Query("SELECT h FROM CaseHearing h WHERE h.presidingJudge = :judge AND DATE(h.hearingDateTime) = :date")
    List<CaseHearing> findByJudgeAndDate(@Param("judge") User judge, @Param("date") LocalDate date);
    
    @Query("SELECT h FROM CaseHearing h WHERE h.courtRoom = :courtRoom AND DATE(h.hearingDateTime) = :date")
    List<CaseHearing> findByCourtRoomAndDate(@Param("courtRoom") String courtRoom, @Param("date") LocalDate date);
    
    @Query("SELECT h FROM CaseHearing h WHERE h.status = :status")
    List<CaseHearing> findByStatus(@Param("status") CaseHearing.HearingStatus status);
    
    @Query("SELECT h FROM CaseHearing h WHERE h.hearingType = :type")
    List<CaseHearing> findByHearingType(@Param("type") CaseHearing.HearingType type);
    
    @Query("SELECT h FROM CaseHearing h WHERE h.hearingDateTime BETWEEN :start AND :end ORDER BY h.hearingDateTime ASC")
    List<CaseHearing> findByDateRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    @Query("SELECT h FROM CaseHearing h WHERE h.hearingDateTime >= :now AND h.status = 'SCHEDULED' ORDER BY h.hearingDateTime ASC")
    List<CaseHearing> findUpcomingHearings(@Param("now") LocalDateTime now);
    
    @Query("SELECT COUNT(h) FROM CaseHearing h WHERE DATE(h.hearingDateTime) = :date")
    long countHearingsByDate(@Param("date") LocalDate date);
    
    @Query("SELECT COUNT(h) FROM CaseHearing h WHERE h.presidingJudge = :judge AND DATE(h.hearingDateTime) = :date")
    long countHearingsByJudgeAndDate(@Param("judge") User judge, @Param("date") LocalDate date);
}
