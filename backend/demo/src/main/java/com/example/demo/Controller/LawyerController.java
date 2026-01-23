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

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/lawyer")
@CrossOrigin(origins = {"http://localhost:3000", "https://ai-court-room-iota.vercel.app", "https://ai-courtroom.vercel.app"})
public class LawyerController {
    
    @Autowired
    private UserAll userRepository;
    
    @Autowired
    private CaseAll caseRepository;
    
    @Autowired
    private CaseRequestRepository caseRequestRepository;

    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboardStats(@RequestHeader("Authorization") String jwt) {
        try {
            String email = JwtProvider.getEmailFromJwt(jwt);
            User lawyer = userRepository.searchByEmail(email);
            
            if (lawyer == null || !lawyer.getIsLawyer()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Lawyer not found"));
            }
            
            // Get pending case requests
            long pendingRequests = caseRequestRepository.countPendingRequestsByLawyer(lawyer);
            
            // Get accepted requests (active cases)
            long acceptedRequests = caseRequestRepository.countAcceptedRequestsByLawyer(lawyer);
            
            // Get total cases from Case repository
            List<Case> totalCases = caseRepository.findCasesByAdvocate(lawyer);
            long activeCases = totalCases.stream().filter(c -> c.getIsDisposed() == null || !c.getIsDisposed()).count();
            long pastCases = totalCases.stream().filter(c -> c.getIsDisposed() != null && c.getIsDisposed()).count();
            
            // Mock active chats (implement with actual chat repository later)
            long activeChats = 3;
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalRequests", pendingRequests);
            stats.put("newRequestsThisWeek", Math.max(0, pendingRequests - 3)); // Mock calculation
            stats.put("acceptedCases", acceptedRequests);
            stats.put("activeCases", activeCases);
            stats.put("activeChats", activeChats);
            stats.put("unreadMessages", 1); // Mock
            stats.put("pastCases", pastCases);
            stats.put("totalCasesHandled", lawyer.getCasesHandled() != null ? lawyer.getCasesHandled() : totalCases.size());
            stats.put("successRate", lawyer.getSuccessRate() != null ? lawyer.getSuccessRate() : 85.0);
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/case-requests")
    public ResponseEntity<?> getCaseRequests(@RequestHeader("Authorization") String jwt) {
        try {
            String email = JwtProvider.getEmailFromJwt(jwt);
            User lawyer = userRepository.searchByEmail(email);
            
            if (lawyer == null || !lawyer.getIsLawyer()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Lawyer not found"));
            }
            
            List<CaseRequest> requests = caseRequestRepository.findByLawyer(lawyer);
            
            List<Map<String, Object>> requestDtos = requests.stream().map(request -> {
                Map<String, Object> dto = new HashMap<>();
                dto.put("id", request.getId());
                dto.put("caseTitle", request.getCaseTitle());
                dto.put("caseDescription", request.getCaseDescription());
                dto.put("caseType", request.getCaseType() != null ? request.getCaseType().getDisplayName() : "");
                dto.put("status", request.getStatus().getDisplayName());
                dto.put("urgency", request.getUrgency());
                dto.put("budget", request.getBudget());
                dto.put("contactPreference", request.getContactPreference());
                dto.put("requestedAt", request.getRequestedAt() != null ? request.getRequestedAt().toString() : "");
                dto.put("respondedAt", request.getRespondedAt() != null ? request.getRespondedAt().toString() : "");
                dto.put("lawyerResponse", request.getLawyerResponse());
                
                // Add user details safely
                if (request.getUser() != null) {
                    Map<String, Object> userDto = new HashMap<>();
                    userDto.put("id", request.getUser().getId());
                    userDto.put("firstName", request.getUser().getFirstName());
                    userDto.put("lastName", request.getUser().getLastName());
                    userDto.put("email", request.getUser().getEmail());
                    userDto.put("mobile", request.getUser().getMobile());
                    dto.put("user", userDto);
                }
                
                return dto;
            }).collect(Collectors.toList());
            
            return ResponseEntity.ok(Map.of("requests", requestDtos));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/case-requests/{requestId}/accept")
    public ResponseEntity<?> acceptCaseRequest(
            @RequestHeader("Authorization") String jwt,
            @PathVariable Integer requestId,
            @RequestBody(required = false) Map<String, String> responseData) {
        try {
            String email = JwtProvider.getEmailFromJwt(jwt);
            User lawyer = userRepository.searchByEmail(email);
            
            if (lawyer == null || !lawyer.getIsLawyer()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Lawyer not found"));
            }
            
            CaseRequest request = caseRequestRepository.findById(requestId).orElse(null);
            if (request == null || !request.getLawyer().getId().equals(lawyer.getId())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Case request not found"));
            }
            
            request.setStatus(CaseRequest.RequestStatus.ACCEPTED);
            request.setRespondedAt(LocalDateTime.now());
            if (responseData != null && responseData.containsKey("response")) {
                request.setLawyerResponse(responseData.get("response"));
            } else {
                request.setLawyerResponse("Case request accepted. I will contact you soon to discuss the details.");
            }
            
            caseRequestRepository.save(request);
            
            return ResponseEntity.ok(Map.of("message", "Case request accepted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/case-requests/{requestId}/reject")
    public ResponseEntity<?> rejectCaseRequest(
            @RequestHeader("Authorization") String jwt,
            @PathVariable Integer requestId,
            @RequestBody(required = false) Map<String, String> responseData) {
        try {
            String email = JwtProvider.getEmailFromJwt(jwt);
            User lawyer = userRepository.searchByEmail(email);
            
            if (lawyer == null || !lawyer.getIsLawyer()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Lawyer not found"));
            }
            
            CaseRequest request = caseRequestRepository.findById(requestId).orElse(null);
            if (request == null || !request.getLawyer().getId().equals(lawyer.getId())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Case request not found"));
            }
            
            request.setStatus(CaseRequest.RequestStatus.REJECTED);
            request.setRespondedAt(LocalDateTime.now());
            if (responseData != null && responseData.containsKey("response")) {
                request.setLawyerResponse(responseData.get("response"));
            } else {
                request.setLawyerResponse("Thank you for considering me. Unfortunately, I cannot take on this case at this time.");
            }
            
            caseRequestRepository.save(request);
            
            return ResponseEntity.ok(Map.of("message", "Case request rejected"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/cases")
    public ResponseEntity<?> getMyCases(@RequestHeader("Authorization") String jwt) {
        try {
            String email = JwtProvider.getEmailFromJwt(jwt);
            User lawyer = userRepository.searchByEmail(email);
            
            if (lawyer == null || !lawyer.getIsLawyer()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Lawyer not found"));
            }
            
            List<Case> cases = caseRepository.findCasesByAdvocate(lawyer);
            
            List<Map<String, Object>> activeCases = cases.stream()
                    .filter(c -> c.getIsDisposed() == null || !c.getIsDisposed())
                    .map(c -> {
                        Map<String, Object> dto = new HashMap<>();
                        dto.put("id", c.getId());
                        dto.put("caseNumber", c.getCaseNumber() != null ? c.getCaseNumber() : "");
                        dto.put("title", c.getTitle() != null ? c.getTitle() : "");
                        dto.put("description", c.getDescription() != null ? c.getDescription() : "");
                        dto.put("caseType", c.getCaseType() != null ? c.getCaseType().getDisplayName() : "");
                        dto.put("status", c.getStatus() != null ? c.getStatus().getDisplayName() : "Filed");
                        dto.put("filingDate", c.getFilingDate() != null ? c.getFilingDate().toString() : "");
                        dto.put("nextHearing", c.getNextHearing() != null ? c.getNextHearing().toString() : "");
                        dto.put("courtLocation", c.getCourtLocation());
                        dto.put("courtRoom", c.getCourtRoom());
                        dto.put("priority", c.getPriority() != null ? c.getPriority().getDisplayName() : "Medium");
                        return dto;
                    }).collect(Collectors.toList());

            List<Map<String, Object>> pastCases = cases.stream()
                    .filter(c -> c.getIsDisposed() != null && c.getIsDisposed())
                    .map(c -> {
                        Map<String, Object> dto = new HashMap<>();
                        dto.put("id", c.getId());
                        dto.put("caseNumber", c.getCaseNumber() != null ? c.getCaseNumber() : "");
                        dto.put("title", c.getTitle() != null ? c.getTitle() : "");
                        dto.put("description", c.getDescription() != null ? c.getDescription() : "");
                        dto.put("caseType", c.getCaseType() != null ? c.getCaseType().getDisplayName() : "");
                        dto.put("status", c.getStatus() != null ? c.getStatus().getDisplayName() : "Disposed");
                        dto.put("filingDate", c.getFilingDate() != null ? c.getFilingDate().toString() : "");
                        dto.put("judgmentDate", c.getJudgmentDate() != null ? c.getJudgmentDate().toString() : "");
                        dto.put("courtLocation", c.getCourtLocation());
                        dto.put("disposalType", c.getDisposalType());
                        return dto;
                    }).collect(Collectors.toList());
            
            return ResponseEntity.ok(Map.of(
                    "activeCases", activeCases,
                    "pastCases", pastCases
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/chats")
    public ResponseEntity<?> getChats(@RequestHeader("Authorization") String jwt) {
        try {
            String email = JwtProvider.getEmailFromJwt(jwt);
            User lawyer = userRepository.searchByEmail(email);
            
            if (lawyer == null || !lawyer.getIsLawyer()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Lawyer not found"));
            }
            
            // Return mock chats for now - implement actual chat repository later
            List<Map<String, Object>> chats = new ArrayList<>();
            
            // Add some mock chat data based on accepted case requests
            List<CaseRequest> acceptedRequests = caseRequestRepository.findAcceptedRequestsByLawyer(lawyer);
            for (CaseRequest request : acceptedRequests.stream().limit(3).collect(Collectors.toList())) {
                Map<String, Object> chat = new HashMap<>();
                chat.put("id", "chat_" + request.getId());
                chat.put("name", request.getUser().getFirstName() + " " + request.getUser().getLastName());
                chat.put("lastMessage", "Regarding case: " + request.getCaseTitle());
                chat.put("timestamp", request.getRespondedAt() != null ? request.getRespondedAt().toString() : "");
                chat.put("unread", Math.random() > 0.5 ? 1 : 0);
                chat.put("caseTitle", request.getCaseTitle());
                chats.add(chat);
            }
            
            return ResponseEntity.ok(Map.of("chats", chats));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
