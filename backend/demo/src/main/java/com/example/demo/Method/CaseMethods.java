package com.example.demo.Method;

import com.example.demo.Classes.Case;
import com.example.demo.Classes.User;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface CaseMethods {
    
    public Case newCase(User user, Case case1);
    public Optional<Case> getCaseById(Integer id);
    public List<Case> getAllCases();
    public Case updateCase(Integer id, Case updatedCase);
    public Case removeCase(User user, Case case1);
    public boolean deleteCase(Integer id);
    
    public String close(Case case1, User judge, String judgement);
    public Case reopenCase(Integer caseId);
    public String judgement(Case case1, User judge, String judgement);
    public Case addJudgement(Integer caseId, String judgement);
    
    public Case selectCaseByJudge(User judge, Case case1);
    public Case selectCaseByLawyer(User lawyer, Case case1);
    public Case assignLawyerToCase(Integer caseId, Integer lawyerId);
    public Case assignJudgeToCase(Integer caseId, Integer judgeId);
    
    public List<Case> search(User judge, String description);
    public List<Case> searchCasesByDescription(String query);
    public List<Case> getActiveCases();
    public List<Case> getClosedCases();
    public List<Case> getCasesByUser(User user);
    public List<Case> getCasesByLawyer(User lawyer);
    public List<Case> getCasesByJudge(User judge);
    public List<Case> getCasesByDateRange(LocalDate startDate, LocalDate endDate);
    public List<Case> getUpcomingHearings();
    
    // Date management
    public Case setNextHearingDate(Integer caseId, LocalDate nextDate);
    public List<Case> getCasesByNextHearingDate(LocalDate date);
    
    // Statistics and utility methods
    public long countActiveCases();
    public long countClosedCases();
    public long countCasesByUser(User user);
    public boolean existsById(Integer id);
}
