package com.example.demo.Controller;

import com.example.demo.Classes.User;
import com.example.demo.Classes.Case;
import com.example.demo.Classes.CaseRequest;
import com.example.demo.Repository.UserAll;
import com.example.demo.Repository.CaseAll;
import com.example.demo.Repository.CaseRequestRepository;
import com.example.demo.Config.JwtProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = {"http://localhost:3000", "https://ai-court-room.vercel.app"})
public class UserControllerAPI {
    
    @Autowired
    private UserAll userRepository;
    
    // Note: CaseAll repository is available for future case-related operations
    @Autowired
    private CaseAll caseRepository;
    
    @Autowired
    private CaseRequestRepository caseRequestRepository;

    @GetMapping("/profile")
    public ResponseEntity<?> getUserProfile(@RequestHeader("Authorization") String jwt) {
        try {
            String email = JwtProvider.getEmailFromJwt(jwt);
            User user = userRepository.searchByEmail(email);
            
            if (user == null) {
                return ResponseEntity.notFound().build();
            }
            
            // Create a safe DTO to avoid lazy loading issues
            Map<String, Object> userDto = new HashMap<>();
            userDto.put("id", user.getId());
            userDto.put("firstName", user.getFirstName());
            userDto.put("lastName", user.getLastName());
            userDto.put("email", user.getEmail());
            userDto.put("mobile", user.getMobile());
            userDto.put("role", user.getRole());
            userDto.put("isLawyer", user.getIsLawyer());
            userDto.put("isJudge", user.getIsJudge());
            userDto.put("description", user.getDescription());
            userDto.put("specialisation", user.getSpecialisation());
            userDto.put("fees", user.getFees());
            userDto.put("image", user.getImage());
            userDto.put("bench", user.getBench());
            userDto.put("court", user.getCourt());
            userDto.put("experience", user.getExperience());
            userDto.put("isActive", user.getIsActive());
            userDto.put("isVerified", user.getIsVerified());
            userDto.put("courtType", user.getCourtType());
            userDto.put("courtLocation", user.getCourtLocation());
            userDto.put("casesHandled", user.getCasesHandled());
            userDto.put("casesWon", user.getCasesWon());
            userDto.put("successRate", user.getSuccessRate());
            userDto.put("averageRating", user.getAverageRating());
            
            // Handle null freeTrialAttempts for existing users
            if (user.getFreeTrialAttempts() == null) {
                user.setFreeTrialAttempts(3);
                userRepository.save(user);
            }
            userDto.put("freeTrialAttempts", user.getFreeTrialAttempts());
            
            return ResponseEntity.ok(userDto);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid token: " + e.getMessage()));
        }
    }

    @PutMapping(value = "/profile", consumes = {"application/json", "application/json;charset=UTF-8"}, produces = "application/json")
    public ResponseEntity<?> updateUserProfile(
            @RequestHeader("Authorization") String jwt,
            @RequestBody User updatedUser) {
        try {
            String email = JwtProvider.getEmailFromJwt(jwt);
            User existingUser = userRepository.searchByEmail(email);
            
            if (existingUser == null) {
                return ResponseEntity.notFound().build();
            }
            
            // Update allowed fields
            existingUser.setFirstName(updatedUser.getFirstName());
            existingUser.setLastName(updatedUser.getLastName());
            existingUser.setMobile(updatedUser.getMobile());
            existingUser.setImage(updatedUser.getImage());
            
            if (existingUser.getIsLawyer()) {
                existingUser.setDescription(updatedUser.getDescription());
                existingUser.setSpecialisation(updatedUser.getSpecialisation());
                existingUser.setFees(updatedUser.getFees());
            }
            
            if (existingUser.getIsJudge()) {
                existingUser.setBench(updatedUser.getBench());
                existingUser.setCourt(updatedUser.getCourt());
                existingUser.setExperience(updatedUser.getExperience());
            }
            
            User savedUser = userRepository.save(existingUser);
            savedUser.setPassword(null);
            
            return ResponseEntity.ok(savedUser);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/lawyers")
    public ResponseEntity<?> getAllLawyers(
            @RequestParam(required = false) String specialization,
            @RequestParam(required = false) Integer maxFees,
            @RequestParam(required = false) String minRating,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String experience) {
        try {
            List<User> lawyers = userRepository.findAll().stream()
                    .filter(user -> user.getIsLawyer() != null && user.getIsLawyer())
                    .filter(user -> specialization == null || specialization.isEmpty() || 
                            (user.getSpecialisation() != null && user.getSpecialisation().equals(specialization)))
                    .filter(user -> maxFees == null || 
                            (user.getFees() != null && user.getFees() <= maxFees))
                    .collect(Collectors.toList());
            
            // Convert to DTOs to avoid lazy loading issues
            List<Map<String, Object>> lawyerDtos = lawyers.stream().map(lawyer -> {
                Map<String, Object> dto = new HashMap<>();
                dto.put("id", lawyer.getId());
                dto.put("firstName", lawyer.getFirstName());
                dto.put("lastName", lawyer.getLastName());
                dto.put("email", lawyer.getEmail());
                dto.put("mobile", lawyer.getMobile());
                dto.put("description", lawyer.getDescription());
                dto.put("specialisation", lawyer.getSpecialisation());
                dto.put("fees", lawyer.getFees());
                dto.put("image", lawyer.getImage());
                dto.put("experience", lawyer.getExperience());
                dto.put("casesHandled", lawyer.getCasesHandled());
                dto.put("casesWon", lawyer.getCasesWon());
                dto.put("successRate", lawyer.getSuccessRate());
                dto.put("averageRating", lawyer.getAverageRating());
                dto.put("isVerified", lawyer.getIsVerified());
                return dto;
            }).collect(Collectors.toList());
            
            return ResponseEntity.ok(lawyerDtos);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping(value = "/request-lawyer/{lawyerId}", consumes = {"application/json", "application/json;charset=UTF-8"}, produces = "application/json")
    public ResponseEntity<?> requestLawyer(
            @RequestHeader("Authorization") String jwt,
            @PathVariable Integer lawyerId,
            @RequestBody Map<String, Object> caseData) {
        try {
            String email = JwtProvider.getEmailFromJwt(jwt);
            User user = userRepository.searchByEmail(email);
            User lawyer = userRepository.findById(lawyerId).orElse(null);
            
            if (user == null || lawyer == null || !lawyer.getIsLawyer()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid user or lawyer"));
            }

            // Create case request
            CaseRequest caseRequest = new CaseRequest();
            caseRequest.setUser(user);
            caseRequest.setLawyer(lawyer);
            caseRequest.setCaseTitle((String) caseData.get("caseTitle"));
            caseRequest.setCaseDescription((String) caseData.get("caseDescription"));
            
            // Handle case type
            String caseTypeStr = (String) caseData.get("caseType");
            if (caseTypeStr != null) {
                try {
                    caseRequest.setCaseType(CaseRequest.CaseType.valueOf(caseTypeStr.toUpperCase()));
                } catch (IllegalArgumentException e) {
                    // Default to CIVIL if invalid type
                    caseRequest.setCaseType(CaseRequest.CaseType.CIVIL);
                }
            }
            
            caseRequest.setUrgency((String) caseData.getOrDefault("urgency", "MEDIUM"));
            
            // Handle budget
            Object budgetObj = caseData.get("budget");
            if (budgetObj != null) {
                if (budgetObj instanceof Number) {
                    caseRequest.setBudget(((Number) budgetObj).doubleValue());
                } else if (budgetObj instanceof String) {
                    try {
                        caseRequest.setBudget(Double.parseDouble((String) budgetObj));
                    } catch (NumberFormatException e) {
                        // Ignore invalid budget
                    }
                }
            }
            
            caseRequest.setContactPreference((String) caseData.getOrDefault("contactPreference", "EMAIL"));
            caseRequest.setStatus(CaseRequest.RequestStatus.PENDING);
            
            caseRequestRepository.save(caseRequest);

            return ResponseEntity.ok(Map.of("message", "Lawyer request sent successfully", "requestId", caseRequest.getId()));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/cases")
    public ResponseEntity<?> getUserCases(@RequestHeader("Authorization") String jwt) {
        try {
            String email = JwtProvider.getEmailFromJwt(jwt);
            User user = userRepository.searchByEmail(email);
            
            if (user == null) {
                return ResponseEntity.notFound().build();
            }
            
            // Use repository queries to fetch real cases for this user and avoid lazy-loading
            List<Case> userCases = new ArrayList<>();

            if (user.getIsLawyer() != null && user.getIsLawyer()) {
                try {
                    userCases = caseRepository.findCasesByAdvocate(user);
                } catch (Exception ex) {
                    userCases = new ArrayList<>();
                }
            } else if (user.getIsJudge() != null && user.getIsJudge()) {
                try {
                    List<Case> presiding = caseRepository.findCasesByPresidingJudge(user);
                    List<Case> bench = caseRepository.findCasesByBenchJudge(user);
                    userCases = new ArrayList<>();
                    if (presiding != null) userCases.addAll(presiding);
                    if (bench != null) userCases.addAll(bench);
                } catch (Exception ex) {
                    userCases = new ArrayList<>();
                }
            } else {
                try {
                    userCases = caseRepository.findCasesByUser(user);
                } catch (Exception ex) {
                    userCases = new ArrayList<>();
                }
            }

            List<Map<String, Object>> activeCases = userCases.stream()
                    .filter(c -> c.getIsDisposed() == null || !c.getIsDisposed())
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
                        m.put("courtLocation", c.getCourtLocation());
                        m.put("courtRoom", c.getCourtRoom());
                        return m;
                    }).collect(Collectors.toList());

            List<Map<String, Object>> pastCases = userCases.stream()
                    .filter(c -> c.getIsDisposed() != null && c.getIsDisposed())
                    .map(c -> {
                        Map<String, Object> m = new HashMap<>();
                        m.put("id", c.getId());
                        m.put("caseNumber", c.getCaseNumber() != null ? c.getCaseNumber() : "");
                        m.put("title", c.getTitle() != null ? c.getTitle() : "");
                        m.put("description", c.getDescription() != null ? c.getDescription() : "");
                        m.put("filingDate", c.getFilingDate() != null ? c.getFilingDate().toString() : "");
                        m.put("nextHearing", c.getNextHearing() != null ? c.getNextHearing().toString() : "");
                        m.put("isDisposed", c.getIsDisposed() != null ? c.getIsDisposed() : false);
                        m.put("status", c.getStatus() != null ? c.getStatus().getDisplayName() : "Disposed");
                        m.put("courtLocation", c.getCourtLocation());
                        m.put("courtRoom", c.getCourtRoom());
                        return m;
                    }).collect(Collectors.toList());

            return ResponseEntity.ok(Map.of(
                    "activeCases", activeCases,
                    "pastCases", pastCases
            ));
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/chats")
    public ResponseEntity<?> getUserChats(@RequestHeader("Authorization") String jwt) {
        try {
            String email = JwtProvider.getEmailFromJwt(jwt);
            User user = userRepository.searchByEmail(email);
            
            if (user == null) {
                return ResponseEntity.notFound().build();
            }
            
            // Return empty chats to avoid lazy loading issues
            // Implement proper chat repository queries as needed
            return ResponseEntity.ok(Map.of(
                "chats", new ArrayList<>(),
                "message", "Chats functionality available - implement chat repository queries"
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/decrement-attempts")
    public ResponseEntity<?> decrementAttempts(@RequestHeader("Authorization") String jwt) {
        try {
            String email = JwtProvider.getEmailFromJwt(jwt);
            User user = userRepository.searchByEmail(email);
            
            if (user == null) {
                return ResponseEntity.notFound().build();
            }
            
            if (user.getFreeTrialAttempts() == null) {
                user.setFreeTrialAttempts(3);
                userRepository.save(user);
            }
            
            if (user.getFreeTrialAttempts() > 0) {
                user.setFreeTrialAttempts(user.getFreeTrialAttempts() - 1);
                userRepository.save(user);
                return ResponseEntity.ok(Map.of("success", true, "attemptsLeft", user.getFreeTrialAttempts()));
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "No free trial attempts left"));
            }
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
