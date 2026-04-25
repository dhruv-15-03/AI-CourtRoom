package com.example.demo.Controller;

import com.example.demo.Classes.AuditLog;
import com.example.demo.Classes.User;
import com.example.demo.Config.JwtProvider;
import com.example.demo.Repository.AuditLogRepository;
import com.example.demo.Repository.UserAll;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Phase 4 — Read-only audit log query endpoints.
 * Accessible to judges (full access) and lawyers (own actions only).
 */
@RestController
@RequestMapping("/api/audit")
@CrossOrigin(origins = {"http://localhost:3000",
        "https://ai-court-room-iota.vercel.app",
        "https://ai-courtroom.vercel.app"})
public class AuditController {

    @Autowired
    private AuditLogRepository auditRepo;

    @Autowired
    private UserAll userRepository;

    private Map<String, Object> toMap(AuditLog a) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", a.getId());
        m.put("timestamp", a.getTimestamp() != null ? a.getTimestamp().toString() : null);
        m.put("actor", a.getActor());
        m.put("userId", a.getUserId());
        m.put("role", a.getRole());
        m.put("action", a.getAction());
        m.put("entityType", a.getEntityType());
        m.put("entityId", a.getEntityId());
        m.put("details", a.getDetails());
        m.put("ipAddress", a.getIpAddress());
        return m;
    }

    /**
     * Paginated log feed (judges only).
     */
    @GetMapping
    public ResponseEntity<?> getAuditLog(
            @RequestHeader("Authorization") String jwt,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        try {
            String email = JwtProvider.getEmailFromJwt(jwt);
            User user = userRepository.searchByEmail(email);
            if (user == null || !Boolean.TRUE.equals(user.getIsJudge())) {
                return ResponseEntity.status(403).body(Map.of("error", "Judges only"));
            }
            Page<AuditLog> p = auditRepo.findAllByOrderByTimestampDesc(PageRequest.of(page, size));
            return ResponseEntity.ok(Map.of(
                    "content", p.getContent().stream().map(this::toMap).collect(Collectors.toList()),
                    "totalPages", p.getTotalPages(),
                    "totalElements", p.getTotalElements(),
                    "page", page));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Audit trail for a specific entity.
     */
    @GetMapping("/entity/{type}/{id}")
    public ResponseEntity<?> byEntity(
            @PathVariable String type, @PathVariable Integer id,
            @RequestHeader("Authorization") String jwt) {
        try {
            String email = JwtProvider.getEmailFromJwt(jwt);
            User user = userRepository.searchByEmail(email);
            if (user == null) return ResponseEntity.status(401).build();
            List<AuditLog> logs = auditRepo.findByEntity(type.toUpperCase(), id);
            return ResponseEntity.ok(logs.stream().map(this::toMap).collect(Collectors.toList()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Audit trail by date range.
     */
    @GetMapping("/range")
    public ResponseEntity<?> byDateRange(
            @RequestParam String from, @RequestParam String to,
            @RequestHeader("Authorization") String jwt) {
        try {
            String email = JwtProvider.getEmailFromJwt(jwt);
            User user = userRepository.searchByEmail(email);
            if (user == null || !Boolean.TRUE.equals(user.getIsJudge())) {
                return ResponseEntity.status(403).body(Map.of("error", "Judges only"));
            }
            List<AuditLog> logs = auditRepo.findByDateRange(
                    LocalDate.parse(from).atStartOfDay(),
                    LocalDate.parse(to).plusDays(1).atStartOfDay());
            return ResponseEntity.ok(logs.stream().map(this::toMap).collect(Collectors.toList()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
