package com.example.demo.Repository;

import com.example.demo.Classes.Case;
import com.example.demo.Classes.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CaseAll extends JpaRepository<Case,Integer> {
    
    // Case Number and Title Search
    @Query("SELECT c FROM Case c WHERE c.caseNumber LIKE :query OR c.title LIKE :query OR c.description LIKE :query")
    List<Case> searchByQuery(@Param("query") String query);
    
    Optional<Case> findByCaseNumber(String caseNumber);
    
    @Query("SELECT c FROM Case c WHERE c.title LIKE :title")
    List<Case> findByTitleContaining(@Param("title") String title);
    
    // Status and Type queries
    @Query("SELECT c FROM Case c WHERE c.status = :status")
    List<Case> findByStatus(@Param("status") Case.CaseStatus status);
    
    @Query("SELECT c FROM Case c WHERE c.caseType = :caseType")
    List<Case> findByCaseType(@Param("caseType") Case.CaseType caseType);
    
    @Query("SELECT c FROM Case c WHERE c.courtType = :courtType")
    List<Case> findByCourtType(@Param("courtType") Case.CourtType courtType);
    
    @Query("SELECT c FROM Case c WHERE c.priority = :priority")
    List<Case> findByPriority(@Param("priority") Case.Priority priority);
    
    // Active/Disposed Cases (updated field names)
    @Query("SELECT c FROM Case c WHERE c.isDisposed = false")
    List<Case> findActiveCases();
    
    @Query("SELECT c FROM Case c WHERE c.isDisposed = true")
    List<Case> findDisposedCases();
    
    // User-based queries (updated relationships)
    @Query("SELECT c FROM Case c JOIN c.petitioners p WHERE p = :user")
    List<Case> findCasesByPetitioner(@Param("user") User user);
    
    @Query("SELECT c FROM Case c JOIN c.advocates a WHERE a = :advocate")
    List<Case> findCasesByAdvocate(@Param("advocate") User advocate);
    
    @Query("SELECT c FROM Case c WHERE c.presidingJudge = :judge")
    List<Case> findCasesByPresidingJudge(@Param("judge") User judge);
    
    @Query("SELECT c FROM Case c JOIN c.benchJudges b WHERE b = :judge")
    List<Case> findCasesByBenchJudge(@Param("judge") User judge);
    
    // Date-based queries (updated field names)
    @Query("SELECT c FROM Case c WHERE c.filingDate BETWEEN :startDate AND :endDate")
    List<Case> findCasesByFilingDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    @Query("SELECT c FROM Case c WHERE DATE(c.nextHearing) = :date")
    List<Case> findCasesByNextHearingDate(@Param("date") LocalDate date);
    
    @Query("SELECT c FROM Case c WHERE c.nextHearing IS NOT NULL AND c.nextHearing >= :from AND c.nextHearing <= :to AND c.isDisposed = false")
    List<Case> findUpcomingHearings(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
    
    @Query("SELECT c FROM Case c WHERE c.nextHearing IS NOT NULL AND DATE(c.nextHearing) = :today AND c.isDisposed = false")
    List<Case> findTodaysHearings(@Param("today") LocalDate today);
    
    // Court Location and Room queries
    @Query("SELECT c FROM Case c WHERE c.courtLocation LIKE :location")
    List<Case> findByCourtLocation(@Param("location") String location);
    
    @Query("SELECT c FROM Case c WHERE c.courtRoom = :courtRoom AND DATE(c.nextHearing) = :date")
    List<Case> findByCourtRoomAndDate(@Param("courtRoom") String courtRoom, @Param("date") LocalDate date);
    
    // Acts and Sections queries
    @Query("SELECT c FROM Case c WHERE EXISTS (SELECT 1 FROM c.actsAndSections a WHERE a LIKE :act)")
    List<Case> findByActOrSection(@Param("act") String act);
    
    // Plaintiff/Defendant queries
    @Query("SELECT c FROM Case c WHERE c.plaintiffPetitioner LIKE :name OR c.defendantRespondent LIKE :name")
    List<Case> findByPartyName(@Param("name") String name);
    
    // Priority and Urgent Cases
    @Query("SELECT c FROM Case c WHERE c.priority = 'HIGH' OR c.priority = 'URGENT' AND c.isDisposed = false ORDER BY c.nextHearing ASC")
    List<Case> findUrgentCases();
    
    // Count queries (updated field names)
    @Query("SELECT COUNT(c) FROM Case c WHERE c.isDisposed = false")
    long countActiveCases();
    
    @Query("SELECT COUNT(c) FROM Case c WHERE c.isDisposed = true")
    long countDisposedCases();
    
    @Query("SELECT COUNT(c) FROM Case c WHERE c.caseType = :caseType")
    long countByCaseType(@Param("caseType") Case.CaseType caseType);
    
    @Query("SELECT COUNT(c) FROM Case c WHERE c.courtType = :courtType")
    long countByCourtType(@Param("courtType") Case.CourtType courtType);
    
    @Query("SELECT COUNT(c) FROM Case c WHERE c.priority = :priority AND c.isDisposed = false")
    long countByPriority(@Param("priority") Case.Priority priority);
    
    // Statistics queries
    @Query("SELECT c.caseType, COUNT(c) FROM Case c GROUP BY c.caseType")
    List<Object[]> getCaseTypeStatistics();
    
    @Query("SELECT c.status, COUNT(c) FROM Case c GROUP BY c.status")
    List<Object[]> getCaseStatusStatistics();
    
    @Query("SELECT c.courtType, COUNT(c) FROM Case c GROUP BY c.courtType")
    List<Object[]> getCourtTypeStatistics();
    
    // Recent activity
    @Query("SELECT c FROM Case c WHERE c.lastUpdated >= :since ORDER BY c.lastUpdated DESC")
    List<Case> findRecentlyUpdatedCases(@Param("since") LocalDateTime since);
    
    @Query("SELECT c FROM Case c WHERE c.filingDate >= :since ORDER BY c.filingDate DESC")
    List<Case> findRecentlyFiledCases(@Param("since") LocalDate since);
    
    // Legacy support for existing queries (backward compatibility)
    @Query("SELECT c FROM Case c WHERE c.description LIKE :query OR c.title LIKE :query")
    List<Case> searchByName(@Param("query") String query);
    
    @Query("SELECT c FROM Case c JOIN c.petitioners u WHERE u = :user")
    List<Case> findCasesByUser(@Param("user") User user);
    
    @Query("SELECT c FROM Case c JOIN c.advocates l WHERE l = :lawyer")
    List<Case> findCasesByLawyer(@Param("lawyer") User lawyer);
    
    @Query("SELECT c FROM Case c WHERE c.presidingJudge = :judge")
    List<Case> findCasesByJudge(@Param("judge") User judge);
    
    @Query("SELECT c FROM Case c WHERE c.filingDate BETWEEN :startDate AND :endDate")
    List<Case> findCasesByDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    @Query("SELECT c FROM Case c WHERE c.nextHearing IS NOT NULL AND c.nextHearing >= :today AND c.isDisposed = false")
    List<Case> findUpcomingHearings(@Param("today") LocalDateTime today);
    
    @Query("SELECT COUNT(c) FROM Case c WHERE c.isDisposed = true")
    long countClosedCases();
}
