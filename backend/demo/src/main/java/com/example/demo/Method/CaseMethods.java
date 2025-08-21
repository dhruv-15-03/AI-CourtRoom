package com.example.demo.Method;

import com.example.demo.Classes.Case;
import com.example.demo.Classes.CaseHearing;
import com.example.demo.Classes.CaseTimeline;
import com.example.demo.Classes.CaseDocument;
import com.example.demo.Classes.User;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface CaseMethods {
    
    // Core Case Management
    public Case fileNewCase(User petitioner, Case case1);
    public Optional<Case> getCaseById(Integer id);
    public Optional<Case> getCaseByCaseNumber(String caseNumber);
    public List<Case> getAllCases();
    public Case updateCase(Integer id, Case updatedCase);
    public Case removeCase(User user, Case case1);
    public boolean deleteCase(Integer id);
    
    // Case Status Management
    public Case updateCaseStatus(Integer caseId, Case.CaseStatus newStatus, String remarks, User updatedBy);
    public Case disposeCaseWithJudgment(Integer caseId, User judge, String judgment, String disposalType);
    public Case reopenCase(Integer caseId, String reason, User reopenedBy);
    
    // Case Assignment and Relations
    public Case assignAdvocateToCase(Integer caseId, Integer advocateId);
    public Case assignPresidingJudge(Integer caseId, Integer judgeId);
    public Case addBenchJudge(Integer caseId, Integer judgeId);
    public Case removeAdvocateFromCase(Integer caseId, Integer advocateId);
    
    // Hearing Management
    public CaseHearing scheduleHearing(Integer caseId, LocalDateTime hearingDateTime, 
                                      CaseHearing.HearingType hearingType, String purpose);
    public CaseHearing updateHearingProceedings(Integer hearingId, String proceedings, 
                                               String orderPassed, LocalDateTime nextHearingDate);
    public CaseHearing postponeHearing(Integer hearingId, LocalDateTime newDateTime, String reason);
    public List<CaseHearing> getHearingsByCase(Integer caseId);
    public List<CaseHearing> getTodaysHearings(LocalDate date);
    public List<CaseHearing> getHearingsByJudge(Integer judgeId, LocalDate date);
    
    // Case Timeline Management
    public CaseTimeline addTimelineEvent(Integer caseId, String eventType, String description, 
                                       String details, String performedBy);
    public List<CaseTimeline> getCaseTimeline(Integer caseId);
    
    // Document Management
    public CaseDocument uploadDocument(Integer caseId, String documentName, String documentType, 
                                     String filePath, String uploadedBy, Boolean isConfidential);
    public List<CaseDocument> getCaseDocuments(Integer caseId);
    public CaseDocument updateDocumentAccess(Integer documentId, String accessLevel);
    
    // Search and Filter
    public List<Case> searchCases(String query);
    public List<Case> searchCasesByTitle(String title);
    public List<Case> searchCasesByPartyName(String partyName);
    public List<Case> searchCasesByActOrSection(String actOrSection);
    public List<Case> filterCasesByType(Case.CaseType caseType);
    public List<Case> filterCasesByStatus(Case.CaseStatus status);
    public List<Case> filterCasesByCourtType(Case.CourtType courtType);
    public List<Case> filterCasesByPriority(Case.Priority priority);
    public List<Case> getUrgentCases();
    
    // User-based Case Retrieval
    public List<Case> getCasesByPetitioner(User petitioner);
    public List<Case> getCasesByAdvocate(User advocate);
    public List<Case> getCasesByPresidingJudge(User judge);
    public List<Case> getCasesByBenchJudge(User judge);
    
    // Date-based Queries
    public List<Case> getCasesByFilingDateRange(LocalDate startDate, LocalDate endDate);
    public List<Case> getCasesWithHearingsInRange(LocalDateTime startDateTime, LocalDateTime endDateTime);
    public List<Case> getUpcomingHearings();
    public List<Case> getOverdueCases();
    
    // Case Statistics and Analytics
    public Map<String, Long> getCaseStatistics();
    public Map<Case.CaseType, Long> getCaseTypeStatistics();
    public Map<Case.CaseStatus, Long> getCaseStatusStatistics();
    public Map<Case.CourtType, Long> getCourtTypeStatistics();
    public long countActiveCases();
    public long countDisposedCases();
    public long countCasesByType(Case.CaseType caseType);
    public long countCasesByPetitioner(User petitioner);
    public long countCasesByAdvocate(User advocate);
    public long countCasesByJudge(User judge);
    
    // Court Management
    public List<Case> getCasesByCourtLocation(String location);
    public List<Case> getCasesByCourtRoom(String courtRoom, LocalDate date);
    public Map<String, Integer> getCourtRoomSchedule(LocalDate date);
    
    // Utility Methods
    public boolean existsById(Integer id);
    public boolean existsByCaseNumber(String caseNumber);
    public String generateCaseNumber(Case.CaseType caseType, Case.CourtType courtType);
    public List<Case> getRecentlyFiledCases(int days);
    public List<Case> getRecentlyUpdatedCases(int hours);
    
    // Legacy Support (for backward compatibility)
    public Case newCase(User user, Case case1);
    public String close(Case case1, User judge, String judgement);
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
    public Case setNextHearingDate(Integer caseId, LocalDate nextDate);
    public List<Case> getCasesByNextHearingDate(LocalDate date);
    public long countCasesByUser(User user);
    public long countClosedCases();
}
