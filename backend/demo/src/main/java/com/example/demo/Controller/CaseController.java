package com.example.demo.Controller;

import java.time.LocalDate;
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
import com.example.demo.Implementation.CaseImplementation;
import com.example.demo.Repository.UserAll;
import com.example.demo.Config.JwtProvider;

@RestController
@RequestMapping("/api/cases")
@CrossOrigin(origins = {"http://localhost:3000", "https://ai-court-room.vercel.app"})
public class CaseController {
    
    @Autowired
    private CaseImplementation caseService;
    
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
            if (caseData.get("date") != null) {
                newCase.setDate(LocalDate.parse((String) caseData.get("date")));
            }
            if (caseData.get("next") != null) {
                newCase.setNext(LocalDate.parse((String) caseData.get("next")));
            }
            
            Case createdCase = caseService.newCase(currentUser, newCase);
            
            return ResponseEntity.ok(Map.of(
                "message", "Case created successfully",
                "caseId", createdCase.getId()
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
                return ResponseEntity.ok(Map.of(
                    "id", c.getId(),
                    "description", c.getDescription() != null ? c.getDescription() : "",
                    "date", c.getDate() != null ? c.getDate().toString() : "",
                    "next", c.getNext() != null ? c.getNext().toString() : "",
                    "isClose", c.getIsClose() != null ? c.getIsClose() : false,
                    "status", c.getIsClose() != null && c.getIsClose() ? "Closed" : "Active",
                    "judgement", c.getJudgement() != null ? c.getJudgement() : List.of(),
                    "judgeId", c.getJudge() != null ? c.getJudge().getId() : null,
                    "judgeName", c.getJudge() != null ? c.getJudge().getFirstName() + " " + c.getJudge().getLastName() : null
                ));
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
                    m.put("description", c.getDescription() != null ? c.getDescription() : "");
                    m.put("date", c.getDate() != null ? c.getDate().toString() : "");
                    m.put("next", c.getNext() != null ? c.getNext().toString() : "");
                    m.put("isClose", c.getIsClose() != null ? c.getIsClose() : false);
                    m.put("status", c.getIsClose() != null && c.getIsClose() ? "Closed" : "Active");
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
            
            if (caseData.get("next") != null) {
                updateCase.setNext(LocalDate.parse((String) caseData.get("next")));
            }
            if (caseData.get("isClose") != null) {
                updateCase.setIsClose((Boolean) caseData.get("isClose"));
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
            caseService.assignLawyerToCase(id, lawyerId);
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
            caseService.assignJudgeToCase(id, judgeId);
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
                String judgement = data != null ? (String) data.get("judgement") : null;
                String result = caseService.close(caseOpt.get(), judge, judgement);
                return ResponseEntity.ok(Map.of("message", result));
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
            
            caseService.addJudgement(id, judgement);
            return ResponseEntity.ok(Map.of("message", "Judgement added successfully"));
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
            
            caseService.setNextHearingDate(id, nextDate);
            return ResponseEntity.ok(Map.of("message", "Next hearing date set successfully"));
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
                    m.put("description", c.getDescription() != null ? c.getDescription() : "");
                    m.put("date", c.getDate() != null ? c.getDate().toString() : "");
                    m.put("status", c.getIsClose() != null && c.getIsClose() ? "Closed" : "Active");
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
                "activeCases", caseService.countActiveCases(),
                "closedCases", caseService.countClosedCases()
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
                    m.put("description", c.getDescription() != null ? c.getDescription() : "");
                    m.put("next", c.getNext() != null ? c.getNext().toString() : "");
                    return m;
                }).collect(Collectors.toList());
            
            return ResponseEntity.ok(simplifiedCases);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
