package com.example.demo.Repository;

import com.example.demo.Classes.CaseRequest;
import com.example.demo.Classes.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CaseRequestRepository extends JpaRepository<CaseRequest, Integer> {
    
    // Find requests by lawyer
    @Query("SELECT cr FROM CaseRequest cr WHERE cr.lawyer = :lawyer ORDER BY cr.requestedAt DESC")
    List<CaseRequest> findByLawyer(@Param("lawyer") User lawyer);
    
    // Find requests by user
    @Query("SELECT cr FROM CaseRequest cr WHERE cr.user = :user ORDER BY cr.requestedAt DESC")
    List<CaseRequest> findByUser(@Param("user") User user);
    
    // Find requests by status
    @Query("SELECT cr FROM CaseRequest cr WHERE cr.status = :status ORDER BY cr.requestedAt DESC")
    List<CaseRequest> findByStatus(@Param("status") CaseRequest.RequestStatus status);
    
    // Find pending requests for a lawyer
    @Query("SELECT cr FROM CaseRequest cr WHERE cr.lawyer = :lawyer AND cr.status = 'PENDING' ORDER BY cr.requestedAt DESC")
    List<CaseRequest> findPendingRequestsByLawyer(@Param("lawyer") User lawyer);
    
    // Find accepted requests for a lawyer
    @Query("SELECT cr FROM CaseRequest cr WHERE cr.lawyer = :lawyer AND cr.status = 'ACCEPTED' ORDER BY cr.requestedAt DESC")
    List<CaseRequest> findAcceptedRequestsByLawyer(@Param("lawyer") User lawyer);
    
    // Find requests by case type
    @Query("SELECT cr FROM CaseRequest cr WHERE cr.caseType = :caseType ORDER BY cr.requestedAt DESC")
    List<CaseRequest> findByCaseType(@Param("caseType") CaseRequest.CaseType caseType);
    
    // Find recent requests
    @Query("SELECT cr FROM CaseRequest cr WHERE cr.requestedAt >= :since ORDER BY cr.requestedAt DESC")
    List<CaseRequest> findRecentRequests(@Param("since") LocalDateTime since);
    
    // Count statistics
    @Query("SELECT COUNT(cr) FROM CaseRequest cr WHERE cr.lawyer = :lawyer AND cr.status = 'PENDING'")
    long countPendingRequestsByLawyer(@Param("lawyer") User lawyer);
    
    @Query("SELECT COUNT(cr) FROM CaseRequest cr WHERE cr.lawyer = :lawyer AND cr.status = 'ACCEPTED'")
    long countAcceptedRequestsByLawyer(@Param("lawyer") User lawyer);
    
    @Query("SELECT COUNT(cr) FROM CaseRequest cr WHERE cr.user = :user")
    long countRequestsByUser(@Param("user") User user);
}
