package com.example.demo.Controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.HashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.demo.Classes.Case;
import com.example.demo.Classes.User;
import com.example.demo.Method.CaseService;
import com.example.demo.Repository.UserAll;
import com.example.demo.Config.JwtProvider;

@RestController
@RequestMapping("/api/cases")
@CrossOrigin(origins = {"http://localhost:3000", "https://ai-court-room-iota.vercel.app", "https://ai-courtroom.vercel.app"})
public class CaseController {
    
    @Autowired
    private CaseService caseService;
    
    @Autowired
    private UserAll userRepository;

    // Basic CRUD Operations
    
    @PostMapping
    public ResponseEntity<?> createCase(
            @RequestHeader("Authorization") String jwt,
            @RequestBody Map<String, Object> caseData) {
        try {
            String email = JwtProvider.getEmailFromJwt(jwt);
            User currentUser = userRepository.searchByEmail(email);
            
            if (currentUser == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }
            
            Case newCase = new Case();
            newCase.setDescription((String) caseData.get("description"));
            
            // Parse dates if provided
            if (caseData.get("filingDate") != null) {
                newCase.setFilingDate(LocalDate.parse((String) caseData.get("filingDate")));
            }
            if (caseData.get("nextHearing") != null) {
                newCase.setNextHearing(LocalDateTime.parse((String) caseData.get("nextHearing")));
            }
            
            Case createdCase = caseService.newCase(newCase);
            
            return ResponseEntity.ok(Map.of(
                "message", "Case created successfully",
                "caseId", createdCase.getId()
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/create-indian-case")
    public ResponseEntity<?> createIndianCase(
            @RequestHeader("Authorization") String jwt,
            @RequestBody Map<String, Object> caseData) {
        try {
            String email = JwtProvider.getEmailFromJwt(jwt);
            User currentUser = userRepository.searchByEmail(email);
            
            if (currentUser == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }
            
            Case newCase = new Case();
            
            // Set case type and court type first (required for other defaults)
            String caseTypeStr = (String) caseData.get("caseType");
            String courtTypeStr = (String) caseData.get("courtType");
            
            if (caseTypeStr != null) {
                newCase.setCaseType(Case.CaseType.valueOf(caseTypeStr.toUpperCase()));
            }
            if (courtTypeStr != null) {
                newCase.setCourtType(Case.CourtType.valueOf(courtTypeStr.toUpperCase()));
            }
            
            // Set basic information
            newCase.setTitle((String) caseData.get("title"));
            newCase.setDescription((String) caseData.get("description"));
            newCase.setPlaintiffPetitioner((String) caseData.get("plaintiff"));
            newCase.setDefendantRespondent((String) caseData.get("defendant"));
            
            // Parse dates if provided
            if (caseData.get("nextHearing") != null) {
                newCase.setNextHearing(LocalDateTime.parse((String) caseData.get("nextHearing")));
            }
            
            // Set court fees if provided
            if (caseData.get("courtFees") != null) {
                newCase.setCourtFees(Double.valueOf(caseData.get("courtFees").toString()));
            }
            
            // Add the petitioner to the case
            if (newCase.getPetitioners() != null) {
                newCase.getPetitioners().add(currentUser);
            }
            
            Case createdCase = caseService.newCase(newCase);
            
            return ResponseEntity.ok(Map.of(
                "message", "Indian legal case created successfully",
                "caseId", createdCase.getId(),
                "caseNumber", createdCase.getCaseNumber(),
                "courtLocation", createdCase.getCourtLocation(),
                "actsAndSections", createdCase.getActsAndSections()
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/indian-templates")
    public ResponseEntity<?> getIndianCaseTemplates() {
        try {
            Map<String, Object> templates = new HashMap<>();
            
            // Criminal case template
            templates.put("criminal", Map.of(
                "title", "State of Delhi vs. [Accused Name]",
                "description", "Case filed under IPC for alleged criminal activities",
                "plaintiff", "State of Delhi",
                "defendant", "[Name of Accused]",
                "caseType", "CRIMINAL",
                "courtType", "SESSIONS_COURT",
                "suggestedActs", List.of("IPC Section 302", "IPC Section 307", "CrPC Section 154"),
                "courtFees", 500.0
            ));
            
            // Civil case template
            templates.put("civil", Map.of(
                "title", "[Plaintiff Name] vs. [Defendant Name]",
                "description", "Civil suit for recovery of money/property dispute",
                "plaintiff", "[Name of Plaintiff]",
                "defendant", "[Name of Defendant]",
                "caseType", "CIVIL",
                "courtType", "DISTRICT_COURT",
                "suggestedActs", List.of("CPC Order VII Rule 1", "Contract Act 1872", "Sale of Goods Act 1930"),
                "courtFees", 1000.0
            ));
            
            // Family case template
            templates.put("family", Map.of(
                "title", "[Petitioner] vs. [Respondent] (Matrimonial)",
                "description", "Petition filed under Hindu Marriage Act for matrimonial relief",
                "plaintiff", "[Name of Petitioner]",
                "defendant", "[Name of Respondent]",
                "caseType", "FAMILY",
                "courtType", "FAMILY_COURT",
                "suggestedActs", List.of("Hindu Marriage Act 1955", "Domestic Violence Act 2005", "Maintenance and Welfare of Parents Act 2007"),
                "courtFees", 750.0
            ));
            
            // Consumer case template
            templates.put("consumer", Map.of(
                "title", "[Consumer Name] vs. [Service Provider/Manufacturer]",
                "description", "Consumer complaint for deficiency in service or defective goods",
                "plaintiff", "[Name of Consumer]",
                "defendant", "[Name of Service Provider]",
                "caseType", "CONSUMER",
                "courtType", "CONSUMER_COURT",
                "suggestedActs", List.of("Consumer Protection Act 2019", "Sale of Goods Act 1930"),
                "courtFees", 200.0
            ));
            
            // Labour case template
            templates.put("labour", Map.of(
                "title", "[Employee/Union] vs. [Employer/Company]",
                "description", "Industrial dispute regarding wages, working conditions or termination",
                "plaintiff", "[Name of Employee/Union]",
                "defendant", "[Name of Employer/Company]",
                "caseType", "LABOUR",
                "courtType", "LABOUR_COURT",
                "suggestedActs", List.of("Industrial Disputes Act 1947", "Payment of Wages Act 1936", "Contract Labour Act 1970"),
                "courtFees", 300.0
            ));
            
            return ResponseEntity.ok(Map.of(
                "message", "Indian legal case templates",
                "templates", templates
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getCaseById(@PathVariable Integer id) {
        try {
            Optional<Case> caseOpt = caseService.getCaseById(id);
            if (caseOpt.isPresent()) {
                Case c = caseOpt.get();
                Map<String, Object> result = new HashMap<>();
                result.put("id", c.getId());
                result.put("caseNumber", c.getCaseNumber() != null ? c.getCaseNumber() : "");
                result.put("title", c.getTitle() != null ? c.getTitle() : "");
                result.put("description", c.getDescription() != null ? c.getDescription() : "");
                result.put("filingDate", c.getFilingDate() != null ? c.getFilingDate().toString() : "");
                result.put("nextHearing", c.getNextHearing() != null ? c.getNextHearing().toString() : "");
                result.put("isDisposed", c.getIsDisposed() != null ? c.getIsDisposed() : false);
                result.put("status", c.getStatus() != null ? c.getStatus().getDisplayName() : "Filed");
                result.put("caseType", c.getCaseType() != null ? c.getCaseType().getDisplayName() : "");
                result.put("courtType", c.getCourtType() != null ? c.getCourtType().getDisplayName() : "");
                result.put("finalJudgments", c.getFinalJudgments() != null ? c.getFinalJudgments() : List.of());
                result.put("judgeId", c.getPresidingJudge() != null ? c.getPresidingJudge().getId() : null);
                result.put("judgeName", c.getPresidingJudge() != null ? c.getPresidingJudge().getFirstName() + " " + c.getPresidingJudge().getLastName() : null);
                return ResponseEntity.ok(result);
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/all")
    public ResponseEntity<?> getAllCases(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        try {
            List<Case> cases;
            
            if (search != null && !search.trim().isEmpty()) {
                cases = caseService.searchCasesByDescription(search);
            } else if ("active".equalsIgnoreCase(status)) {
                cases = caseService.getActiveCases();
            } else if ("closed".equalsIgnoreCase(status)) {
                cases = caseService.getClosedCases();
            } else {
                cases = caseService.getAllCases();
            }
            
            List<Map<String, Object>> simplifiedCases = cases.stream()
                .map(c -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", c.getId());
                    m.put("caseNumber", c.getCaseNumber() != null ? c.getCaseNumber() : "");
                    m.put("title", c.getTitle() != null ? c.getTitle() : "");
                    m.put("description", c.getDescription() != null ? c.getDescription() : "");
                    m.put("filingDate", c.getFilingDate() != null ? c.getFilingDate().toString() : "");
                    m.put("nextHearing", c.getNextHearing() != null ? c.getNextHearing().toString() : "");
                    m.put("isDisposed", c.getIsDisposed() != null ? c.getIsDisposed() : false);
                    m.put("status", c.getStatus() != null ? c.getStatus().getDisplayName() : "Filed");
                    m.put("caseType", c.getCaseType() != null ? c.getCaseType().getDisplayName() : "");
                    m.put("courtType", c.getCourtType() != null ? c.getCourtType().getDisplayName() : "");
                    return m;
                }).collect(Collectors.toList());
            
            return ResponseEntity.ok(simplifiedCases);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> updateCase(
            @PathVariable Integer id,
            @RequestBody Map<String, Object> caseData) {
        try {
            Case updateCase = new Case();
            updateCase.setDescription((String) caseData.get("description"));
            updateCase.setTitle((String) caseData.get("title"));
            updateCase.setCaseNumber((String) caseData.get("caseNumber"));
            
            if (caseData.get("nextHearing") != null) {
                updateCase.setNextHearing(LocalDateTime.parse((String) caseData.get("nextHearing")));
            }
            if (caseData.get("isDisposed") != null) {
                updateCase.setIsDisposed((Boolean) caseData.get("isDisposed"));
            }
            
            caseService.updateCase(id, updateCase);
            return ResponseEntity.ok(Map.of("message", "Case updated successfully"));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCase(@PathVariable Integer id) {
        try {
            boolean deleted = caseService.deleteCase(id);
            if (deleted) {
                return ResponseEntity.ok(Map.of("message", "Case deleted successfully"));
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    // Case Management Operations
    
    @PostMapping("/{id}/assign-lawyer/{lawyerId}")
    public ResponseEntity<?> assignLawyer(
            @PathVariable Integer id,
            @PathVariable Integer lawyerId) {
        try {
            caseService.assignLawyer(id, lawyerId);
            return ResponseEntity.ok(Map.of("message", "Lawyer assigned successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/{id}/assign-judge/{judgeId}")
    public ResponseEntity<?> assignJudge(
            @PathVariable Integer id,
            @PathVariable Integer judgeId) {
        try {
            caseService.assignJudge(id, judgeId);
            return ResponseEntity.ok(Map.of("message", "Judge assigned successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/{id}/close")
    public ResponseEntity<?> closeCase(
            @PathVariable Integer id,
            @RequestHeader("Authorization") String jwt,
            @RequestBody(required = false) Map<String, Object> data) {
        try {
            String email = JwtProvider.getEmailFromJwt(jwt);
            User judge = userRepository.searchByEmail(email);
            
            if (judge == null || judge.getIsJudge() == null || !judge.getIsJudge()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Only judges can close cases"));
            }
            
            Optional<Case> caseOpt = caseService.getCaseById(id);
            if (caseOpt.isPresent()) {
                caseService.closeCase(id);
                return ResponseEntity.ok(Map.of("message", "Case closed successfully"));
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/{id}/reopen")
    public ResponseEntity<?> reopenCase(@PathVariable Integer id) {
        try {
            caseService.reopenCase(id);
            return ResponseEntity.ok(Map.of("message", "Case reopened successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/{id}/judgement")
    public ResponseEntity<?> addJudgement(
            @PathVariable Integer id,
            @RequestHeader("Authorization") String jwt,
            @RequestBody Map<String, Object> data) {
        try {
            String email = JwtProvider.getEmailFromJwt(jwt);
            User judge = userRepository.searchByEmail(email);
            
            if (judge == null || judge.getIsJudge() == null || !judge.getIsJudge()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Only judges can add judgements"));
            }
            
            String judgement = (String) data.get("judgement");
            if (judgement == null || judgement.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Judgement cannot be empty"));
            }
            
            // For now, we'll add judgement by updating the case
            Optional<Case> caseOpt = caseService.getCaseById(id);
            if (caseOpt.isPresent()) {
                Case caseEntity = caseOpt.get();
                if (caseEntity.getFinalJudgments() != null) {
                    caseEntity.getFinalJudgments().add(judgement);
                } else {
                    caseEntity.setFinalJudgments(List.of(judgement));
                }
                caseService.updateCase(id, caseEntity);
                return ResponseEntity.ok(Map.of("message", "Judgement added successfully"));
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/{id}/next-hearing")
    public ResponseEntity<?> setNextHearing(
            @PathVariable Integer id,
            @RequestBody Map<String, Object> data) {
        try {
            String dateStr = (String) data.get("date");
            LocalDate nextDate = LocalDate.parse(dateStr);
            
            // Set next hearing by updating the case
            Optional<Case> caseOpt = caseService.getCaseById(id);
            if (caseOpt.isPresent()) {
                Case caseEntity = caseOpt.get();
                caseEntity.setNextHearing(nextDate.atStartOfDay()); // Convert LocalDate to LocalDateTime
                caseService.updateCase(id, caseEntity);
                return ResponseEntity.ok(Map.of("message", "Next hearing date set successfully"));
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    // Search and Statistics
    
    @GetMapping("/search")
    public ResponseEntity<?> searchCases(@RequestParam String query) {
        try {
            List<Case> cases = caseService.searchCasesByDescription(query);
            List<Map<String, Object>> simplifiedCases = cases.stream()
                .map(c -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", c.getId());
                    m.put("caseNumber", c.getCaseNumber() != null ? c.getCaseNumber() : "");
                    m.put("title", c.getTitle() != null ? c.getTitle() : "");
                    m.put("description", c.getDescription() != null ? c.getDescription() : "");
                    m.put("filingDate", c.getFilingDate() != null ? c.getFilingDate().toString() : "");
                    m.put("status", c.getStatus() != null ? c.getStatus().getDisplayName() : "Filed");
                    m.put("caseType", c.getCaseType() != null ? c.getCaseType().getDisplayName() : "");
                    return m;
                }).collect(Collectors.toList());
            
            return ResponseEntity.ok(simplifiedCases);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/statistics")
    public ResponseEntity<?> getCaseStatistics() {
        try {
            return ResponseEntity.ok(Map.of(
                "totalCases", caseService.getAllCases().size(),
                "activeCases", caseService.getActiveCasesCount(),
                "closedCases", caseService.getClosedCasesCount()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/upcoming-hearings")
    public ResponseEntity<?> getUpcomingHearings() {
        try {
            List<Case> cases = caseService.getUpcomingHearings();
            List<Map<String, Object>> simplifiedCases = cases.stream()
                .map(c -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", c.getId());
                    m.put("caseNumber", c.getCaseNumber() != null ? c.getCaseNumber() : "");
                    m.put("title", c.getTitle() != null ? c.getTitle() : "");
                    m.put("description", c.getDescription() != null ? c.getDescription() : "");
                    m.put("nextHearing", c.getNextHearing() != null ? c.getNextHearing().toString() : "");
                    return m;
                }).collect(Collectors.toList());
            
            return ResponseEntity.ok(simplifiedCases);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
