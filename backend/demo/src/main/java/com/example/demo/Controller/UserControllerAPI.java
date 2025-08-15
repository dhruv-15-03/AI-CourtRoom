package com.example.demo.Controller;

import com.example.demo.Classes.User;
import com.example.demo.Classes.Case;
import com.example.demo.Repository.UserAll;
import com.example.demo.Repository.CaseAll;
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
    
    @Autowired
    private CaseAll caseRepository;

    @GetMapping("/profile")
    public ResponseEntity<?> getUserProfile(@RequestHeader("Authorization") String jwt) {
        try {
            String email = JwtProvider.getEmailFromJwt(jwt);
            User user = userRepository.searchByEmail(email);
            
            if (user == null) {
                return ResponseEntity.notFound().build();
            }
            
            user.setPassword(null);
            
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid token"));
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
                existingUser.setYears(updatedUser.getYears());
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
            @RequestParam(required = false) Integer maxFees) {
        try {
            List<User> lawyers = userRepository.findAll().stream()
                    .filter(User::getIsLawyer)
                    .filter(user -> specialization == null || user.getSpecialisation().equals(specialization))
                    .filter(user -> maxFees == null || user.getFees() <= maxFees)
                    .collect(Collectors.toList());
            
            lawyers.forEach(lawyer -> lawyer.setPassword(null));
            
            return ResponseEntity.ok(lawyers);
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

            return ResponseEntity.ok(Map.of("message", "Lawyer request sent successfully"));
            
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
            
            List<Map<String, Object>> activeCases = new ArrayList<>();
            List<Map<String, Object>> pastCases = new ArrayList<>();

            if (user.getActive() != null && !user.getActive().isEmpty()) {
                for (Case c : user.getActive()) {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", c.getId());
                    m.put("description", c.getDescription() != null ? c.getDescription() : "");
                    m.put("date", c.getDate() != null ? c.getDate().toString() : "");
                    m.put("next", c.getNext() != null ? c.getNext().toString() : "");
                    m.put("isClose", c.getIsClose() != null ? c.getIsClose() : false);
                    m.put("status", c.getIsClose() != null && c.getIsClose() ? "Closed" : "Active");
                    activeCases.add(m);
                }
            }

            if (user.getPastCases() != null && !user.getPastCases().isEmpty()) {
                for (Case c : user.getPastCases()) {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", c.getId());
                    m.put("description", c.getDescription() != null ? c.getDescription() : "");
                    m.put("date", c.getDate() != null ? c.getDate().toString() : "");
                    m.put("next", c.getNext() != null ? c.getNext().toString() : "");
                    m.put("isClose", c.getIsClose() != null ? c.getIsClose() : false);
                    m.put("status", c.getIsClose() != null && c.getIsClose() ? "Closed" : "Active");
                    pastCases.add(m);
                }
            }

            
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
            
            // Return user's chats
            return ResponseEntity.ok(user.getChats() != null ? user.getChats() : List.of());
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    
}
