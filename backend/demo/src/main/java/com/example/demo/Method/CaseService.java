package com.example.demo.Method;

import com.example.demo.Classes.Case;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface CaseService {
    // Core CRUD methods needed by controller
    Case newCase(Case caseEntity);
    Optional<Case> getCaseById(Integer id);
    List<Case> getAllCases();
    Case updateCase(Integer id, Case caseEntity);
    boolean deleteCase(Integer id);
    
    // Filtering methods
    List<Case> getActiveCases();
    List<Case> getClosedCases();
    List<Case> searchCasesByDescription(String query);
    List<Case> getUpcomingHearings();

    // Paginated variants (B-3) — DB-level paging for list endpoints.
    Page<Case> getAllCases(Pageable pageable);
    Page<Case> getActiveCases(Pageable pageable);
    Page<Case> getClosedCases(Pageable pageable);
    Page<Case> searchCasesByDescription(String query, Pageable pageable);
    
    // Assignment methods
    Case assignLawyer(Integer caseId, Integer lawyerId);
    Case assignJudge(Integer caseId, Integer judgeId);
    
    // Status methods
    Case closeCase(Integer id);
    Case reopenCase(Integer id);
    
    // Statistics
    long getActiveCasesCount();
    long getClosedCasesCount();
}
