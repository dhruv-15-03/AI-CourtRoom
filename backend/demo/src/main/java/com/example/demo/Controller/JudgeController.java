package com.example.demo.Controller;

import com.example.demo.Classes.Case;
import com.example.demo.Classes.User;
import com.example.demo.Repository.CaseAll;
import com.example.demo.Repository.UserAll;
import com.example.demo.Config.JwtProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Controller for Judge-specific operations.
 * Provides dashboard stats, pending cases, judgments, and case management.
 */
@RestController
@RequestMapping("/api/judge")
@CrossOrigin(origins = {"http://localhost:3000", "https://ai-court-room-iota.vercel.app", "https://ai-courtroom.vercel.app"})
public class JudgeController {
    
    @Autowired
    private UserAll userRepository;
    
    @Autowired
    private CaseAll caseRepository;

    /**
     * Get dashboard statistics for the judge
     */
    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboardStats(@RequestHeader("Authorization") String jwt) {
        try {
            String email = JwtProvider.getEmailFromJwt(jwt);
            User judge = userRepository.searchByEmail(email);
            
            if (judge == null || !Boolean.TRUE.equals(judge.getIsJudge())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Judge not found or unauthorized"));
            }
            
            // Get cases assigned to this judge
            List<Case> presidingCases = caseRepository.findCasesByPresidingJudge(judge);
            List<Case> benchCases = caseRepository.findCasesByBenchJudge(judge);
            
            // Combine all cases
            Set<Case> allCases = new HashSet<>();
            allCases.addAll(presidingCases);
            allCases.addAll(benchCases);
            
            // Calculate statistics
            long pendingCases = allCases.stream()
                    .filter(c -> c.getIsDisposed() == null || !c.getIsDisposed())
                    .count();
            
            long judgmentsDelivered = allCases.stream()
                    .filter(c -> c.getIsDisposed() != null && c.getIsDisposed())
                    .count();
            
            // Cases this month
            LocalDate startOfMonth = LocalDate.now().withDayOfMonth(1);
            long casesThisMonth = allCases.stream()
                    .filter(c -> c.getFilingDate() != null && !c.getFilingDate().isBefore(startOfMonth))
                    .count();
            
            // Calculate average days to verdict (mock calculation based on disposed cases)
            int avgDaysToVerdict = calculateAverageDaysToVerdict(allCases);
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("pendingCases", pendingCases);
            stats.put("judgmentsDelivered", judgmentsDelivered);
            stats.put("casesThisMonth", casesThisMonth);
            stats.put("avgDaysToVerdict", avgDaysToVerdict);
            stats.put("totalCases", allCases.size());
            stats.put("judgeName", judge.getFirstName() + " " + judge.getLastName());
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Get all pending cases for the judge
     */
    @GetMapping("/pending-cases")
    public ResponseEntity<?> getPendingCases(@RequestHeader("Authorization") String jwt) {
        try {
            String email = JwtProvider.getEmailFromJwt(jwt);
            User judge = userRepository.searchByEmail(email);
            
            if (judge == null || !Boolean.TRUE.equals(judge.getIsJudge())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Judge not found or unauthorized"));
            }
            
            // Get cases assigned to this judge
            List<Case> presidingCases = caseRepository.findCasesByPresidingJudge(judge);
            List<Case> benchCases = caseRepository.findCasesByBenchJudge(judge);
            
            // Combine and filter for pending cases only
            Set<Case> allCases = new HashSet<>();
            allCases.addAll(presidingCases);
            allCases.addAll(benchCases);
            
            List<Map<String, Object>> pendingCaseDtos = allCases.stream()
                    .filter(c -> c.getIsDisposed() == null || !c.getIsDisposed())
                    .sorted(Comparator.comparing(Case::getNextHearing, Comparator.nullsLast(Comparator.naturalOrder())))
                    .map(this::formatCaseDto)
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(Map.of("cases", pendingCaseDtos));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Get case details by ID
     */
    @GetMapping("/cases/{caseId}")
    public ResponseEntity<?> getCaseDetails(
            @RequestHeader("Authorization") String jwt,
            @PathVariable Integer caseId) {
        try {
            String email = JwtProvider.getEmailFromJwt(jwt);
            User judge = userRepository.searchByEmail(email);
            
            if (judge == null || !Boolean.TRUE.equals(judge.getIsJudge())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Judge not found or unauthorized"));
            }
            
            Optional<Case> caseOptional = caseRepository.findById(caseId);
            if (caseOptional.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Case courtCase = caseOptional.get();
            
            // Verify judge has access to this case
            boolean hasAccess = (courtCase.getPresidingJudge() != null && courtCase.getPresidingJudge().getId().equals(judge.getId()))
                    || (courtCase.getBenchJudges() != null && courtCase.getBenchJudges().contains(judge));
            
            if (!hasAccess) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied to this case"));
            }
            
            return ResponseEntity.ok(formatDetailedCaseDto(courtCase));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Update case status
     */
    @PutMapping("/cases/{caseId}/status")
    public ResponseEntity<?> updateCaseStatus(
            @RequestHeader("Authorization") String jwt,
            @PathVariable Integer caseId,
            @RequestBody Map<String, String> statusData) {
        try {
            String email = JwtProvider.getEmailFromJwt(jwt);
            User judge = userRepository.searchByEmail(email);
            
            if (judge == null || !Boolean.TRUE.equals(judge.getIsJudge())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Judge not found or unauthorized"));
            }
            
            Optional<Case> caseOptional = caseRepository.findById(caseId);
            if (caseOptional.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Case courtCase = caseOptional.get();
            
            String newStatus = statusData.get("status");
            if (newStatus != null) {
                try {
                    courtCase.setStatus(Case.CaseStatus.valueOf(newStatus.toUpperCase()));
                    courtCase.setLastAction("Status updated to " + newStatus + " by Judge " + judge.getLastName());
                    caseRepository.save(courtCase);
                    
                    return ResponseEntity.ok(Map.of("message", "Case status updated successfully"));
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Invalid status value"));
                }
            }
            
            return ResponseEntity.badRequest().body(Map.of("error", "Status is required"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Add judgment to a case
     */
    @PostMapping("/cases/{caseId}/judgment")
    public ResponseEntity<?> addJudgment(
            @RequestHeader("Authorization") String jwt,
            @PathVariable Integer caseId,
            @RequestBody Map<String, String> judgmentData) {
        try {
            String email = JwtProvider.getEmailFromJwt(jwt);
            User judge = userRepository.searchByEmail(email);
            
            if (judge == null || !Boolean.TRUE.equals(judge.getIsJudge())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Judge not found or unauthorized"));
            }
            
            Optional<Case> caseOptional = caseRepository.findById(caseId);
            if (caseOptional.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Case courtCase = caseOptional.get();
            
            String judgment = judgmentData.get("judgment");
            if (judgment != null && !judgment.isBlank()) {
                // Add judgment to case
                if (courtCase.getFinalJudgments() == null) {
                    courtCase.setFinalJudgments(new ArrayList<>());
                }
                
                String formattedJudgment = String.format("[%s] Judge %s %s: %s",
                        LocalDateTime.now().toString(),
                        judge.getFirstName(),
                        judge.getLastName(),
                        judgment);
                
                courtCase.getFinalJudgments().add(formattedJudgment);
                courtCase.setIsDisposed(true);
                courtCase.setDisposalType("JUDGMENT");
                courtCase.setJudgmentDate(LocalDate.now());
                courtCase.setStatus(Case.CaseStatus.DISPOSED);
                courtCase.setLastAction("Judgment delivered by Judge " + judge.getLastName());
                
                caseRepository.save(courtCase);
                
                return ResponseEntity.ok(Map.of("message", "Judgment added successfully"));
            }
            
            return ResponseEntity.badRequest().body(Map.of("error", "Judgment text is required"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Get all judgments delivered by the judge
     */
    @GetMapping("/judgments")
    public ResponseEntity<?> getJudgments(@RequestHeader("Authorization") String jwt) {
        try {
            String email = JwtProvider.getEmailFromJwt(jwt);
            User judge = userRepository.searchByEmail(email);
            
            if (judge == null || !Boolean.TRUE.equals(judge.getIsJudge())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Judge not found or unauthorized"));
            }
            
            // Get disposed cases
            List<Case> presidingCases = caseRepository.findCasesByPresidingJudge(judge);
            List<Case> benchCases = caseRepository.findCasesByBenchJudge(judge);
            
            Set<Case> allCases = new HashSet<>();
            allCases.addAll(presidingCases);
            allCases.addAll(benchCases);
            
            List<Map<String, Object>> judgmentDtos = allCases.stream()
                    .filter(c -> c.getIsDisposed() != null && c.getIsDisposed())
                    .sorted(Comparator.comparing(Case::getJudgmentDate, Comparator.nullsLast(Comparator.reverseOrder())))
                    .map(this::formatJudgmentDto)
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(Map.of("judgments", judgmentDtos));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    // Helper methods
    
    private int calculateAverageDaysToVerdict(Set<Case> cases) {
        List<Case> disposedCases = cases.stream()
                .filter(c -> c.getIsDisposed() != null && c.getIsDisposed() 
                        && c.getFilingDate() != null && c.getJudgmentDate() != null)
                .collect(Collectors.toList());
        
        if (disposedCases.isEmpty()) {
            return 14; // Default average
        }
        
        long totalDays = disposedCases.stream()
                .mapToLong(c -> java.time.temporal.ChronoUnit.DAYS.between(c.getFilingDate(), c.getJudgmentDate()))
                .sum();
        
        return (int) (totalDays / disposedCases.size());
    }
    
    private Map<String, Object> formatCaseDto(Case courtCase) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", courtCase.getId());
        dto.put("caseNumber", courtCase.getCaseNumber());
        dto.put("title", courtCase.getTitle());
        dto.put("description", courtCase.getDescription());
        dto.put("caseType", courtCase.getCaseType() != null ? courtCase.getCaseType().getDisplayName() : null);
        dto.put("courtType", courtCase.getCourtType() != null ? courtCase.getCourtType().getDisplayName() : null);
        dto.put("status", courtCase.getStatus() != null ? courtCase.getStatus().getDisplayName() : null);
        dto.put("priority", courtCase.getPriority() != null ? courtCase.getPriority().name() : null);
        dto.put("plaintiff", courtCase.getPlaintiffPetitioner());
        dto.put("defendant", courtCase.getDefendantRespondent());
        dto.put("nextHearing", courtCase.getNextHearing() != null ? courtCase.getNextHearing().toString() : null);
        dto.put("filingDate", courtCase.getFilingDate() != null ? courtCase.getFilingDate().toString() : null);
        dto.put("courtLocation", courtCase.getCourtLocation());
        dto.put("courtRoom", courtCase.getCourtRoom());
        return dto;
    }
    
    private Map<String, Object> formatDetailedCaseDto(Case courtCase) {
        Map<String, Object> dto = formatCaseDto(courtCase);
        dto.put("actsAndSections", courtCase.getActsAndSections());
        dto.put("orders", courtCase.getOrders());
        dto.put("documents", courtCase.getDocuments());
        dto.put("courtFees", courtCase.getCourtFees());
        dto.put("lastAction", courtCase.getLastAction());
        dto.put("createdAt", courtCase.getCreatedAt() != null ? courtCase.getCreatedAt().toString() : null);
        dto.put("lastUpdated", courtCase.getLastUpdated() != null ? courtCase.getLastUpdated().toString() : null);
        
        // Add presiding judge info
        if (courtCase.getPresidingJudge() != null) {
            Map<String, Object> judgeDto = new HashMap<>();
            judgeDto.put("id", courtCase.getPresidingJudge().getId());
            judgeDto.put("firstName", courtCase.getPresidingJudge().getFirstName());
            judgeDto.put("lastName", courtCase.getPresidingJudge().getLastName());
            dto.put("presidingJudge", judgeDto);
        }
        
        return dto;
    }
    
    private Map<String, Object> formatJudgmentDto(Case courtCase) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", courtCase.getId());
        dto.put("caseNumber", courtCase.getCaseNumber());
        dto.put("title", courtCase.getTitle());
        dto.put("caseType", courtCase.getCaseType() != null ? courtCase.getCaseType().getDisplayName() : null);
        dto.put("plaintiff", courtCase.getPlaintiffPetitioner());
        dto.put("defendant", courtCase.getDefendantRespondent());
        dto.put("judgmentDate", courtCase.getJudgmentDate() != null ? courtCase.getJudgmentDate().toString() : null);
        dto.put("disposalType", courtCase.getDisposalType());
        dto.put("judgments", courtCase.getFinalJudgments());
        return dto;
    }
}
