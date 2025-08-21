package com.example.demo.Implementation;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.demo.Classes.Case;
import com.example.demo.Classes.User;
import com.example.demo.Method.CaseService;
import com.example.demo.Repository.CaseAll;
import com.example.demo.Repository.UserAll;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CaseServiceImpl implements CaseService {
    
    @Autowired
    private CaseAll caseRepository;
    
    @Autowired
    private UserAll userRepository;
    
    @Override
    public Case newCase(Case caseEntity) {
        // Set default values for Indian legal system requirements
        if (caseEntity.getFilingDate() == null) {
            caseEntity.setFilingDate(LocalDate.now());
        }
        if (caseEntity.getStatus() == null) {
            caseEntity.setStatus(Case.CaseStatus.FILED);
        }
        if (caseEntity.getIsDisposed() == null) {
            caseEntity.setIsDisposed(false);
        }
        if (caseEntity.getCaseType() == null) {
            caseEntity.setCaseType(Case.CaseType.CIVIL);
        }
        if (caseEntity.getCourtType() == null) {
            caseEntity.setCourtType(Case.CourtType.DISTRICT_COURT);
        }
        
        // Generate Indian case number format if not provided
        if (caseEntity.getCaseNumber() == null) {
            caseEntity.setCaseNumber(generateIndianCaseNumber(caseEntity.getCaseType(), caseEntity.getCourtType()));
        }
        
        // Set default court location based on court type
        if (caseEntity.getCourtLocation() == null) {
            caseEntity.setCourtLocation(getDefaultCourtLocation(caseEntity.getCourtType()));
        }
        
        // Set default priority
        if (caseEntity.getPriority() == null) {
            caseEntity.setPriority(Case.Priority.MEDIUM);
        }
        
        // Set realistic Indian legal acts if not provided
        if (caseEntity.getActsAndSections() == null || caseEntity.getActsAndSections().isEmpty()) {
            caseEntity.setActsAndSections(getDefaultActsForCaseType(caseEntity.getCaseType()));
        }
        
        return caseRepository.save(caseEntity);
    }
    
    @Override
    public Optional<Case> getCaseById(Integer id) {
        return caseRepository.findById(id);
    }
    
    @Override
    public List<Case> getAllCases() {
        return caseRepository.findAll();
    }
    
    @Override
    public Case updateCase(Integer id, Case caseEntity) {
        Optional<Case> existingCaseOpt = caseRepository.findById(id);
        if (existingCaseOpt.isPresent()) {
            Case existingCase = existingCaseOpt.get();
            
            // Update only non-null fields
            if (caseEntity.getTitle() != null) {
                existingCase.setTitle(caseEntity.getTitle());
            }
            if (caseEntity.getDescription() != null) {
                existingCase.setDescription(caseEntity.getDescription());
            }
            if (caseEntity.getCaseNumber() != null) {
                existingCase.setCaseNumber(caseEntity.getCaseNumber());
            }
            if (caseEntity.getNextHearing() != null) {
                existingCase.setNextHearing(caseEntity.getNextHearing());
            }
            if (caseEntity.getIsDisposed() != null) {
                existingCase.setIsDisposed(caseEntity.getIsDisposed());
            }
            if (caseEntity.getStatus() != null) {
                existingCase.setStatus(caseEntity.getStatus());
            }
            if (caseEntity.getFinalJudgments() != null) {
                existingCase.setFinalJudgments(caseEntity.getFinalJudgments());
            }
            
            return caseRepository.save(existingCase);
        }
        return null;
    }
    
    @Override
    public boolean deleteCase(Integer id) {
        if (caseRepository.existsById(id)) {
            caseRepository.deleteById(id);
            return true;
        }
        return false;
    }
    
    @Override
    public List<Case> getActiveCases() {
        return caseRepository.findAll().stream()
            .filter(c -> c.getIsDisposed() == null || !c.getIsDisposed())
            .collect(Collectors.toList());
    }
    
    @Override
    public List<Case> getClosedCases() {
        return caseRepository.findAll().stream()
            .filter(c -> c.getIsDisposed() != null && c.getIsDisposed())
            .collect(Collectors.toList());
    }
    
    @Override
    public List<Case> searchCasesByDescription(String query) {
        return caseRepository.findAll().stream()
            .filter(c -> {
                String searchText = query.toLowerCase();
                return (c.getDescription() != null && c.getDescription().toLowerCase().contains(searchText)) ||
                       (c.getTitle() != null && c.getTitle().toLowerCase().contains(searchText)) ||
                       (c.getCaseNumber() != null && c.getCaseNumber().toLowerCase().contains(searchText));
            })
            .collect(Collectors.toList());
    }
    
    @Override
    public List<Case> getUpcomingHearings() {
        LocalDateTime now = LocalDateTime.now();
        return caseRepository.findAll().stream()
            .filter(c -> c.getNextHearing() != null && c.getNextHearing().isAfter(now))
            .filter(c -> c.getIsDisposed() == null || !c.getIsDisposed())
            .collect(Collectors.toList());
    }
    
    @Override
    public Case assignLawyer(Integer caseId, Integer lawyerId) {
        Optional<Case> caseOpt = caseRepository.findById(caseId);
        Optional<User> lawyerOpt = userRepository.findById(lawyerId);
        
        if (caseOpt.isPresent() && lawyerOpt.isPresent()) {
            Case caseEntity = caseOpt.get();
            User lawyer = lawyerOpt.get();
            
            // Initialize advocates set if null
            if (caseEntity.getAdvocates() == null) {
                caseEntity.setAdvocates(new java.util.HashSet<>());
            }
            
            caseEntity.getAdvocates().add(lawyer);
            return caseRepository.save(caseEntity);
        }
        return null;
    }
    
    @Override
    public Case assignJudge(Integer caseId, Integer judgeId) {
        Optional<Case> caseOpt = caseRepository.findById(caseId);
        Optional<User> judgeOpt = userRepository.findById(judgeId);
        
        if (caseOpt.isPresent() && judgeOpt.isPresent()) {
            Case caseEntity = caseOpt.get();
            User judge = judgeOpt.get();
            caseEntity.setPresidingJudge(judge);
            return caseRepository.save(caseEntity);
        }
        return null;
    }
    
    @Override
    public Case closeCase(Integer id) {
        Optional<Case> caseOpt = caseRepository.findById(id);
        if (caseOpt.isPresent()) {
            Case caseEntity = caseOpt.get();
            caseEntity.setIsDisposed(true);
            caseEntity.setStatus(Case.CaseStatus.DISPOSED);
            caseEntity.setJudgmentDate(LocalDate.now());
            return caseRepository.save(caseEntity);
        }
        return null;
    }
    
    @Override
    public Case reopenCase(Integer id) {
        Optional<Case> caseOpt = caseRepository.findById(id);
        if (caseOpt.isPresent()) {
            Case caseEntity = caseOpt.get();
            caseEntity.setIsDisposed(false);
            caseEntity.setStatus(Case.CaseStatus.UNDER_TRIAL);
            caseEntity.setJudgmentDate(null); // Clear judgment date
            return caseRepository.save(caseEntity);
        }
        return null;
    }
    
    @Override
    public long getActiveCasesCount() {
        return getActiveCases().size();
    }
    
    @Override
    public long getClosedCasesCount() {
        return getClosedCases().size();
    }
    
    // Helper methods for Indian legal system
    
    /**
     * Generate realistic Indian case numbers based on case type and court type
     */
    private String generateIndianCaseNumber(Case.CaseType caseType, Case.CourtType courtType) {
        String prefix = getIndianCasePrefix(caseType, courtType);
        long count = caseRepository.count() + 1;
        int year = LocalDate.now().getYear();
        return String.format("%s %d/%d", prefix, count, year);
    }
    
    private String getIndianCasePrefix(Case.CaseType caseType, Case.CourtType courtType) {
        if (courtType == Case.CourtType.HIGH_COURT) {
            switch (caseType) {
                case CRIMINAL: return "CRL.A.";
                case CIVIL: return "C.S.";
                case CONSTITUTIONAL: return "W.P.(C)";
                case FAMILY: return "MAT.APP.";
                case CONSUMER: return "CONS.";
                default: return "MISC.";
            }
        } else if (courtType == Case.CourtType.SUPREME_COURT) {
            switch (caseType) {
                case CRIMINAL: return "SLP(CRL.)";
                case CIVIL: return "SLP(C)";
                case CONSTITUTIONAL: return "W.P.(C)";
                default: return "SLP";
            }
        } else {
            switch (caseType) {
                case CRIMINAL: return "CR.";
                case CIVIL: return "CS";
                case FAMILY: return "HMA";
                default: return "MISC.";
            }
        }
    }
    
    /**
     * Get default court location based on court type
     */
    private String getDefaultCourtLocation(Case.CourtType courtType) {
        switch (courtType) {
            case SUPREME_COURT:
                return "Supreme Court of India, New Delhi";
            case HIGH_COURT:
                return "Delhi High Court, New Delhi";
            case DISTRICT_COURT:
                return "District Court, Central Delhi";
            case SESSIONS_COURT:
                return "Sessions Court, Delhi";
            case MAGISTRATE_COURT:
                return "Metropolitan Magistrate Court, Delhi";
            case FAMILY_COURT:
                return "Family Court, Delhi";
            case CONSUMER_COURT:
                return "District Consumer Disputes Redressal Commission, Delhi";
            default:
                return "District Court, Delhi";
        }
    }
    
    /**
     * Get default Indian legal acts based on case type
     */
    private java.util.List<String> getDefaultActsForCaseType(Case.CaseType caseType) {
        switch (caseType) {
            case CRIMINAL:
                return java.util.Arrays.asList("IPC Section 302", "CrPC Section 154");
            case CIVIL:
                return java.util.Arrays.asList("CPC Order VII Rule 1", "Contract Act 1872");
            case FAMILY:
                return java.util.Arrays.asList("Hindu Marriage Act 1955", "Domestic Violence Act 2005");
            case CONSUMER:
                return java.util.Arrays.asList("Consumer Protection Act 2019");
            case LABOUR:
                return java.util.Arrays.asList("Industrial Disputes Act 1947", "Payment of Wages Act 1936");
            case CONSTITUTIONAL:
                return java.util.Arrays.asList("Article 32", "Article 226");
            case CYBER_CRIME:
                return java.util.Arrays.asList("IT Act 2000 Section 66A", "IPC Section 420");
            case ENVIRONMENTAL:
                return java.util.Arrays.asList("Environment Protection Act 1986", "Water Act 1974");
            default:
                return java.util.Arrays.asList("CPC", "IPC");
        }
    }
}
