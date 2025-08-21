package com.example.demo.Method;

import com.example.demo.Classes.Case;
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
